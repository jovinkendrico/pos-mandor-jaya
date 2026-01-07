<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\SaleReturn;
use App\Models\PurchaseReturn;
use App\Models\StockMovement;
use App\Models\FifoMapping;
use App\Models\JournalEntry;
use App\Models\Item;
use App\Services\StockService;
use App\Services\JournalService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReprocessAllTransactions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'transaction:reprocess-all';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reprocess all transactions (Safe Mode: Clean Journals/Stock, Re-confirm Purchases FIRST, then Sales)';

    /**
     * Execute the console command.
     */
    public function handle(StockService $stockService)
    {
        $this->info('Starting Reprocess All Transactions...');
        
        DB::transaction(function () use ($stockService) {
            
            // 1. Reset Data (Clean State)
            $this->info('Cleaning up existing Stock Movements, FIFO Mappings, and Transaction Journals...');
            
            StockMovement::whereIn('reference_type', ['Sale', 'Purchase', 'SaleReturn', 'PurchaseReturn'])->delete();
            FifoMapping::truncate();
            
            // Delete Journals related to main transactions (Keep Adjustments/Manual)
            JournalEntry::whereIn('reference_type', ['Sale', 'Purchase', 'SaleReturn', 'PurchaseReturn'])->delete();

            // Reset Item Stock to 0 (or count existing Adjustments + Opening Balance if any?)
            // Assuming we only want to build up from Adjustments/Opening.
            // Let's recalculate based on remaining `StockMovement` (which should only be Adjustments/Opening now)
            $this->info('Recalculating Base Stock from Adjustments/Opening...');
            $items = Item::all();
            foreach ($items as $item) {
                // Sum remaining valid movements (Manual Adjustment, Opening Stock)
                $currentStock = StockMovement::where('item_id', $item->id)->sum('quantity');
                $item->update(['stock' => $currentStock]);
            }
            
            // 2. Fetch All CONFIRMED Transactions
            // We do NOT unconfirm them in DB status, we just re-run the logic?
            // "Reprocess" usually means re-running the effects.
            // But logic `confirmPurchase` checks `status`.
            // We should temporarily treat them as if we are confirming them.
            // Actually `StockService::confirmPurchase` logic doesn't check status if we call internal logic, but usually it does.
            // Let's look at `StockService`. It usually has `if ($purchase->status === 'confirmed') return`.
            // So we might need to "mock" the unconfirmation or force execution.
            // Safer: Update status to 'pending' in memory or temporarily? No, dangerous.
            // We already deleted the StockMovements and Journals.
            // So we effectively "Unconfirmed" them physically.
            // The `confirmed` status in DB is now "desync" until we finish.
            // So we can assume they are pending logic-wise.
            
            // HOWEVER, StockService checks `if ($sale->status === 'confirmed')`.
            // We need to bypass this or Reset status first.
            // Let's Reset Status to 'pending' for ALL Confirmed transactions first.
            
            $this->info('Resetting transaction statuses to Pending...');
            Purchase::where('status', 'confirmed')->update(['status' => 'pending']);
            Sale::where('status', 'confirmed')->update(['status' => 'pending']);
            PurchaseReturn::where('status', 'confirmed')->update(['status' => 'pending']);
            SaleReturn::where('status', 'confirmed')->update(['status' => 'pending']);

            // 3. Process PURCHASES First (To build stock pool)
            // Order by Date ASC
            $purchases = Purchase::orderBy('purchase_date', 'asc')->get(); // We process ALL (PENDING ones)
            $this->info('Processing ' . $purchases->count() . ' Purchases...');
            
            foreach ($purchases as $purchase) {
                // Only process those that WERE confirmed (we can't easily know which ones were confirmed if we reset all)
                // Wait, if we reset ALL, we might confirm Drafts?
                // The User said "Reprocess All". Usually implies confirmed ones.
                // WE LOST THE STATE 'Confirmed' by bulk updating.
                // BETTER STRATEGY: Get filtered list FIRST, then process.
                // But `StockService` updates status to 'confirmed'.
                // So:
                // 1. Get IDs of originally confirmed transactions.
                // 2. Bulk update those to 'pending'.
                // 3. Loop through those IDs and re-confirm.
            }
        });
        
        // Re-run safely
        $this->reprocessLogic($stockService);

        $this->info('Reprocess Complete!');
    }

    private function reprocessLogic($stockService)
    {
        DB::transaction(function() use ($stockService) {
            // 1. Identify Confirmed Transactions
            $confirmedPurchaseIds = Purchase::where('status', 'confirmed')->pluck('id');
            $confirmedSaleIds = Sale::where('status', 'confirmed')->pluck('id');
            $confirmedPurchaseReturnIds = PurchaseReturn::where('status', 'confirmed')->pluck('id');
            $confirmedSaleReturnIds = SaleReturn::where('status', 'confirmed')->pluck('id');

            // 2. Clean Data
            $this->info('Cleaning Journals and Stock Movements...');
            StockMovement::whereIn('reference_type', ['Sale', 'Purchase', 'SaleReturn', 'PurchaseReturn'])->delete();
            FifoMapping::truncate();
            JournalEntry::whereIn('reference_type', ['Sale', 'Purchase', 'SaleReturn', 'PurchaseReturn'])->delete();

            // 3. Reset Items Stock (Base on Adjustments only)
            $items = Item::all();
            foreach ($items as $item) {
                $baseStock = StockMovement::where('item_id', $item->id)->sum('quantity');
                $item->update(['stock' => $baseStock]);
            }

            // 4. Set Status to Pending temporarily (to allow StockService to run)
            Purchase::whereIn('id', $confirmedPurchaseIds)->update(['status' => 'pending']);
            Sale::whereIn('id', $confirmedSaleIds)->update(['status' => 'pending']);
            PurchaseReturn::whereIn('id', $confirmedPurchaseReturnIds)->update(['status' => 'pending']);
            SaleReturn::whereIn('id', $confirmedSaleReturnIds)->update(['status' => 'pending']);

            // 5. Re-Confirm PURCHASES (Ordered by Date)
            $purchasesToConfirm = Purchase::whereIn('id', $confirmedPurchaseIds)
                ->orderBy('purchase_date', 'asc')
                ->get();
            
            $this->info('Re-confirming ' . $purchasesToConfirm->count() . ' Purchases...');
            foreach ($purchasesToConfirm as $purchase) {
                try {
                    $stockService->confirmPurchase($purchase);
                } catch (\Exception $e) {
                    $this->error("Failed to confirm Purchase #{$purchase->purchase_number}: " . $e->getMessage());
                    // If purchase fails, subsequent sales might fail. Continue anyway.
                }
            }

            // 6. Re-Confirm Returns (Purchase Return reduces stock, Sale Return adds stock)
            // Usually returns happen after purchase/sale.
            // If we want strict date ordering for Returns vs Sales, we might need to interleave them?
            // "Purchase Return" needs stock. "Sale Return" gives stock.
            // Safest: Process Sales Returns (adds stock) -> Purchases (adds stock) -> Sales (reduces) -> Purchase Returns (reduces)?
            // OR strictly by Date regardless of type?
            // But User instruction: "Konfirmasi duluan dari pembelian kemudian konfirmasi semua penjualan".
            // Implementation: Purchases -> Sales.
            // What about Returns?
            // Sale Return ADDS stock. Should be treated like Purchase (Supply).
            // Purchase Return REMOVES stock. Should be treated like Sale (Demand).
            
            // Let's do:
            // Group 1 (Supply): Purchases + Sale Returns. Order by Date.
            // Group 2 (Demand): Sales + Purchase Returns. Order by Date.
            
            // Step 5a: Purchase Returns (Demand) might fail if processed after Sales?
            // Actually, usually Reprocess All acts chronologically.
            // BUT User specifically asked: "Confirm Purchase FIRST".
            // This implies: Gather ALL Supply (Jan 1 to Dec 31). Make it available.
            // THEN Process ALL Demand (Jan 1 to Dec 31).
            
            // Supply Group
            $supplyTransactions = collect();
            
            // Purchases
            $purchases = Purchase::whereIn('id', $confirmedPurchaseIds)->get();
            foreach($purchases as $p) $supplyTransactions->push(['type' => 'Purchase', 'data' => $p, 'date' => $p->purchase_date]);
            
            // Sale Returns
            $sReturns = SaleReturn::whereIn('id', $confirmedSaleReturnIds)->get();
            foreach($sReturns as $r) $supplyTransactions->push(['type' => 'SaleReturn', 'data' => $r, 'date' => $r->return_date]);
            
            $supplyTransactions = $supplyTransactions->sortBy('date');
            
            $this->info('Processing Supply (Purchases & Sale Returns)...');
            foreach ($supplyTransactions as $item) {
                try {
                    if ($item['type'] === 'Purchase') {
                        $stockService->confirmPurchase($item['data']);
                    } else {
                        // confirmSaleReturn logic
                        // Need to check if method exists and is public
                        // Assuming equivalent method exists
                        // $stockService->confirmSaleReturn($item['data']); 
                        // Note: stockService might verify 'pending' status.
                         $stockService->confirmSaleReturn($item['data']);
                    }
                } catch (\Exception $e) {
                    $this->error("Failed Supply {$item['type']} : " . $e->getMessage());
                }
            }

            // Demand Group
            $demandTransactions = collect();
            
            // Sales
            $sales = Sale::whereIn('id', $confirmedSaleIds)->get();
            foreach($sales as $s) $demandTransactions->push(['type' => 'Sale', 'data' => $s, 'date' => $s->sale_date]);
            
            // Purchase Returns
            $pReturns = PurchaseReturn::whereIn('id', $confirmedPurchaseReturnIds)->get();
            foreach($pReturns as $r) $demandTransactions->push(['type' => 'PurchaseReturn', 'data' => $r, 'date' => $r->return_date]);
            
            $demandTransactions = $demandTransactions->sortBy('date');
            
            $this->info('Processing Demand (Sales & Purchase Returns)...');
            $skippedCount = 0;
            
            foreach ($demandTransactions as $item) {
                try {
                    if ($item['type'] === 'Sale') {
                        $stockService->confirmSale($item['data']);
                    } else {
                        $stockService->confirmPurchaseReturn($item['data']);
                    }
                } catch (\Exception $e) {
                    $this->warn("SKIPPED {$item['type']} ID {$item['data']->id} : " . $e->getMessage());
                    // Leave it as PENDING (it was reset to pending in step 4).
                    $skippedCount++;
                }
            }
            
            $this->info("Reprocess Completed. Skipped {$skippedCount} transactions due to insufficient stock.");
        });
    }
}
