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
use Illuminate\Support\Facades\DB;

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
    protected $description = 'Reprocess all transactions (Safe Mode: Clean Journals/Stock, Re-confirm Supply FIRST, then Demand)';

    /**
     * Execute the console command.
     */
    public function handle(StockService $stockService)
    {
        $this->info('Starting Reprocess All Transactions...');

        // 1. Capture IDs of ALL transactions (Including Pending/Confirmed)
        // Since previous failed runs might have reset everything to 'pending', and user wants to "Process All",
        // we essentially confirm EVERYTHING that is not explicitly cancelled.
        $confirmedPurchaseIds = Purchase::where('status', '!=', 'cancelled')->pluck('id');
        $confirmedSaleIds = Sale::where('status', '!=', 'cancelled')->pluck('id');
        $confirmedPurchaseReturnIds = PurchaseReturn::where('status', '!=', 'cancelled')->pluck('id');
        $confirmedSaleReturnIds = SaleReturn::where('status', '!=', 'cancelled')->pluck('id');
        
        $this->info("Found: " . $confirmedPurchaseIds->count() . " Purchases, " . $confirmedSaleIds->count() . " Sales.");

        DB::transaction(function () use ($stockService, $confirmedPurchaseIds, $confirmedSaleIds, $confirmedPurchaseReturnIds, $confirmedSaleReturnIds) {
            
            // 2. Clear Data
            $this->info('Cleaning data...');
            StockMovement::whereIn('reference_type', ['Sale', 'Purchase', 'SaleReturn', 'PurchaseReturn'])->delete();
            // Use delete() instead of truncate() to avoid DB implicit commit
            FifoMapping::query()->delete(); 
            JournalEntry::whereIn('reference_type', ['Sale', 'Purchase', 'SaleReturn', 'PurchaseReturn'])->delete();
            
            // 3. Reset Items Stock (Adjustments + Opening)
            $this->info('Resetting Base Stock...');
            $items = Item::all();
            foreach ($items as $item) {
                // Only adjustments/opening remain
                $baseStock = StockMovement::where('item_id', $item->id)->sum('quantity');
                $item->update(['stock' => $baseStock]);
            }
            
            // 4. Reset Status to Pending
            $this->info('Resetting Statuses...');
            Purchase::whereIn('id', $confirmedPurchaseIds)->update(['status' => 'pending']);
            Sale::whereIn('id', $confirmedSaleIds)->update(['status' => 'pending']);
            PurchaseReturn::whereIn('id', $confirmedPurchaseReturnIds)->update(['status' => 'pending']);
            SaleReturn::whereIn('id', $confirmedSaleReturnIds)->update(['status' => 'pending']);
            
            // 5. Supply Phase: Purchases + Sale Returns (Build Stock Pool)
            // Sort by Date ASC to mimic chronological supply arrival
            $supply = collect();
            
            $purchases = Purchase::whereIn('id', $confirmedPurchaseIds)->get();
            foreach($purchases as $p) $supply->push(['type' => 'Purchase', 'data' => $p, 'date' => $p->purchase_date]);
            
            $sReturns = SaleReturn::whereIn('id', $confirmedSaleReturnIds)->get();
            foreach($sReturns as $r) $supply->push(['type' => 'SaleReturn', 'data' => $r, 'date' => $r->return_date]);
            
            $supply = $supply->sortBy('date');
            
            $this->info('Processing Supply (Purchases & Sale Returns)...');
            foreach ($supply as $item) {
                try {
                     if ($item['type'] === 'Purchase') $stockService->confirmPurchase($item['data']);
                     else $stockService->confirmSaleReturn($item['data']);
                } catch (\Exception $e) { 
                    $this->error("Supply Error [{$item['type']}]: " . $e->getMessage()); 
                }
            }
            
            // 6. Demand Phase: Sales + Purchase Returns (Consume from Pool)
            // Sort by Date ASC
            $demand = collect();
            
            $sales = Sale::whereIn('id', $confirmedSaleIds)->get();
            foreach($sales as $s) $demand->push(['type' => 'Sale', 'data' => $s, 'date' => $s->sale_date]);
            
            $pReturns = PurchaseReturn::whereIn('id', $confirmedPurchaseReturnIds)->get();
            foreach($pReturns as $r) $demand->push(['type' => 'PurchaseReturn', 'data' => $r, 'date' => $r->return_date]);
            
            $demand = $demand->sortBy('date');
            
            $this->info('Processing Demand (Sales & Purchase Returns)...');
            $skippedCount = 0;
            
            foreach ($demand as $item) {
                try {
                     if ($item['type'] === 'Sale') $stockService->confirmSale($item['data']);
                     else $stockService->confirmPurchaseReturn($item['data']);
                } catch (\Exception $e) { 
                    $this->warn("Skipped {$item['type']} #{$item['data']->id} (Insufficient Stock): " . $e->getMessage()); 
                    $skippedCount++;
                    // Status remains 'pending'
                }
            }
            
            $this->info("Reprocess Completed. Skipped {$skippedCount} transactions.");
        });
        
        $this->info('Done.');
    }
}
