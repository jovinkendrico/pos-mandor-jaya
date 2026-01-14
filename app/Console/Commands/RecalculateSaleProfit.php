<?php

namespace App\Console\Commands;

use App\Models\Item;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\StockMovement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecalculateSaleProfit extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sales:recalculate-profit 
                            {item_code? : Item code to recalculate (default: MJ394)}
                            {--dry-run : Run without making changes}
                            {--all : Recalculate all items}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate sale profit when HPP has been adjusted';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $itemCode = $this->argument('item_code') ?? 'MJ394';
        $dryRun = $this->option('dry-run');
        $all = $this->option('all');

        $this->info('=== Recalculate Sale Profit ===');
        $this->info('Dry Run: ' . ($dryRun ? 'YES' : 'NO'));
        
        if ($all) {
            $this->warn('Recalculating ALL items...');
            $items = Item::all();
        } else {
            $this->info('Item Code: ' . $itemCode);
            $item = Item::where('code', $itemCode)->first();
            
            if (!$item) {
                $this->error("Item with code '{$itemCode}' not found!");
                return 1;
            }
            
            $items = collect([$item]);
        }

        $totalSalesAffected = 0;
        $totalProfitDiff = 0;

        foreach ($items as $item) {
            $this->info("\n--- Processing Item: {$item->code} - {$item->name} ---");
            
            // Get current average HPP from stock movements
            $currentHpp = $this->getCurrentHpp($item->id);
            $this->info("Current HPP: " . number_format($currentHpp, 2));

            // Find all confirmed sales with this item
            $saleDetails = SaleDetail::whereHas('sale', function ($q) {
                $q->where('status', 'confirmed');
            })
            ->where('item_id', $item->id)
            ->with(['sale', 'itemUom'])
            ->get();

            if ($saleDetails->isEmpty()) {
                $this->warn("No confirmed sales found for this item.");
                continue;
            }

            $this->info("Found {$saleDetails->count()} sale details to process");

            $itemSalesAffected = 0;
            $itemProfitDiff = 0;

            foreach ($saleDetails as $detail) {
                $result = $this->recalculateDetail($detail, $currentHpp, $dryRun);
                
                if ($result['changed']) {
                    $itemSalesAffected++;
                    $itemProfitDiff += $result['profit_diff'];
                    
                    $this->line(sprintf(
                        "  Sale #%s - Detail #%d: Cost %.2f -> %.2f | Profit %.2f -> %.2f (Diff: %.2f)",
                        $detail->sale->sale_number,
                        $detail->id,
                        $result['old_cost'],
                        $result['new_cost'],
                        $result['old_profit'],
                        $result['new_profit'],
                        $result['profit_diff']
                    ));
                }
            }

            $totalSalesAffected += $itemSalesAffected;
            $totalProfitDiff += $itemProfitDiff;

            $this->info("Item Summary: {$itemSalesAffected} sales affected, Total Profit Diff: " . number_format($itemProfitDiff, 2));
        }

        $this->info("\n=== Summary ===");
        $this->info("Total Sales Affected: {$totalSalesAffected}");
        $this->info("Total Profit Difference: " . number_format($totalProfitDiff, 2));
        
        if ($dryRun) {
            $this->warn("\nThis was a DRY RUN. No changes were made.");
            $this->warn("Run without --dry-run to apply changes.");
        } else {
            $this->info("\nChanges have been applied successfully!");
        }

        return 0;
    }

    /**
     * Get current HPP for an item (weighted average from stock movements)
     */
    private function getCurrentHpp(int $itemId): float
    {
        // Get weighted average from remaining stock movements
        $movements = StockMovement::where('item_id', $itemId)
            ->where('remaining_quantity', '>', 0)
            ->where('quantity', '>', 0)
            ->get();

        if ($movements->isEmpty()) {
            // Fallback to item's modal_price
            $item = Item::find($itemId);
            return $item ? (float) $item->modal_price : 0;
        }

        $totalValue = 0;
        $totalQty = 0;

        foreach ($movements as $movement) {
            $totalValue += $movement->remaining_quantity * $movement->unit_cost;
            $totalQty += $movement->remaining_quantity;
        }

        return $totalQty > 0 ? $totalValue / $totalQty : 0;
    }

    /**
     * Recalculate a single sale detail
     */
    private function recalculateDetail(SaleDetail $detail, float $newHpp, bool $dryRun): array
    {
        $oldCost = (float) $detail->cost;
        $oldProfit = (float) $detail->profit;

        // Calculate base quantity (convert from UOM to base)
        $conversion = $detail->itemUom ? (float) $detail->itemUom->conversion_value : 1;
        if ($conversion < 1) $conversion = 1;
        
        $baseQuantity = (float) $detail->quantity * $conversion;

        // Calculate new cost using current HPP
        $newCost = $baseQuantity * $newHpp;
        $newProfit = (float) $detail->subtotal - $newCost;

        $profitDiff = $newProfit - $oldProfit;
        $costDiff = $newCost - $oldCost;

        // Check if there's a significant change (more than 0.01)
        $changed = abs($profitDiff) > 0.01;

        if ($changed && !$dryRun) {
            DB::transaction(function () use ($detail, $newCost, $newProfit, $costDiff, $profitDiff) {
                // Update sale detail
                $detail->update([
                    'cost' => $newCost,
                    'profit' => $newProfit,
                ]);

                // Update sale totals
                $sale = $detail->sale;
                $sale->increment('total_cost', $costDiff);
                $sale->increment('total_profit', $profitDiff);

                // Adjust journal entry for COGS
                if (abs($costDiff) > 0.01) {
                    try {
                        app(\App\Services\JournalService::class)->adjustSaleCogs($sale, $costDiff);
                    } catch (\Exception $e) {
                        Log::error('Failed to adjust COGS journal entry', [
                            'sale_id' => $sale->id,
                            'sale_detail_id' => $detail->id,
                            'cost_diff' => $costDiff,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                Log::info('Recalculated sale profit', [
                    'sale_id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'detail_id' => $detail->id,
                    'item_id' => $detail->item_id,
                    'old_cost' => $oldCost,
                    'new_cost' => $newCost,
                    'old_profit' => $oldProfit,
                    'new_profit' => $newProfit,
                    'profit_diff' => $profitDiff,
                ]);
            });
        }

        return [
            'changed' => $changed,
            'old_cost' => $oldCost,
            'new_cost' => $newCost,
            'old_profit' => $oldProfit,
            'new_profit' => $newProfit,
            'profit_diff' => $profitDiff,
        ];
    }
}
