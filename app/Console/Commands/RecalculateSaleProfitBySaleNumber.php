<?php

namespace App\Console\Commands;

use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\StockMovement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecalculateSaleProfitBySaleNumber extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sales:recalculate-by-number 
                            {sale_number : Sale number to recalculate (e.g., MJ394)}
                            {--dry-run : Run without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate profit for a specific sale by sale number';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $saleNumber = $this->argument('sale_number');
        $dryRun = $this->option('dry-run');

        $this->info('=== Recalculate Sale Profit by Sale Number ===');
        $this->info('Sale Number: ' . $saleNumber);
        $this->info('Dry Run: ' . ($dryRun ? 'YES' : 'NO'));
        $this->newLine();

        // Find the sale
        $sale = Sale::where('sale_number', $saleNumber)->first();

        if (!$sale) {
            $this->error("Sale with number '{$saleNumber}' not found!");
            return 1;
        }

        if ($sale->status !== 'confirmed') {
            $this->error("Sale '{$saleNumber}' is not confirmed (status: {$sale->status})!");
            return 1;
        }

        $this->info("Found Sale: #{$sale->sale_number}");
        $this->info("Date: {$sale->sale_date}");
        $this->info("Customer: " . ($sale->customer->name ?? 'N/A'));
        $this->info("Current Total Cost: " . number_format($sale->total_cost, 2));
        $this->info("Current Total Profit: " . number_format($sale->total_profit, 2));
        $this->newLine();

        // Load details
        $sale->load(['details.item', 'details.itemUom', 'details.fifoMappings.stockMovement']);

        $this->info("Processing {$sale->details->count()} sale details...");
        $this->newLine();

        $totalOldCost = 0;
        $totalNewCost = 0;
        $totalOldProfit = 0;
        $totalNewProfit = 0;

        $changes = [];

        foreach ($sale->details as $detail) {
            $result = $this->recalculateDetail($detail);
            
            $totalOldCost += $result['old_cost'];
            $totalNewCost += $result['new_cost'];
            $totalOldProfit += $result['old_profit'];
            $totalNewProfit += $result['new_profit'];

            $changes[] = $result;

            if ($result['changed']) {
                $this->line(sprintf(
                    "  %-30s | Qty: %8.2f | Cost: %12.2f -> %12.2f | Profit: %12.2f -> %12.2f | Diff: %12.2f",
                    substr($detail->item->name ?? 'Unknown', 0, 30),
                    $detail->quantity,
                    $result['old_cost'],
                    $result['new_cost'],
                    $result['old_profit'],
                    $result['new_profit'],
                    $result['profit_diff']
                ));
            } else {
                $this->line(sprintf(
                    "  %-30s | Qty: %8.2f | Cost: %12.2f (no change)",
                    substr($detail->item->name ?? 'Unknown', 0, 30),
                    $detail->quantity,
                    $result['old_cost']
                ));
            }
        }

        $this->newLine();
        $this->info('=== Summary ===');
        $this->table(
            ['Metric', 'Old', 'New', 'Difference'],
            [
                ['Total Cost', number_format($totalOldCost, 2), number_format($totalNewCost, 2), number_format($totalNewCost - $totalOldCost, 2)],
                ['Total Profit', number_format($totalOldProfit, 2), number_format($totalNewProfit, 2), number_format($totalNewProfit - $totalOldProfit, 2)],
            ]
        );

        $costDiff = $totalNewCost - $totalOldCost;
        $profitDiff = $totalNewProfit - $totalOldProfit;

        if (abs($costDiff) < 0.01) {
            $this->info("\nNo changes needed. Profit is already correct.");
            return 0;
        }

        if ($dryRun) {
            $this->warn("\nThis was a DRY RUN. No changes were made.");
            $this->warn("Run without --dry-run to apply changes.");
            return 0;
        }

        // Apply changes
        if ($this->confirm('Do you want to apply these changes?', true)) {
            DB::transaction(function () use ($sale, $changes, $costDiff, $profitDiff) {
                foreach ($changes as $change) {
                    if ($change['changed']) {
                        $detail = SaleDetail::find($change['detail_id']);
                        $detail->update([
                            'cost' => $change['new_cost'],
                            'profit' => $change['new_profit'],
                        ]);
                    }
                }

                // Update sale totals
                $sale->update([
                    'total_cost' => $sale->total_cost + $costDiff,
                    'total_profit' => $sale->total_profit + $profitDiff,
                ]);

                // Adjust journal entry
                if (abs($costDiff) > 0.01) {
                    try {
                        app(\App\Services\JournalService::class)->adjustSaleCogs($sale, $costDiff);
                        $this->info("Journal entry adjusted successfully.");
                    } catch (\Exception $e) {
                        $this->error("Failed to adjust journal entry: " . $e->getMessage());
                        Log::error('Failed to adjust COGS journal entry', [
                            'sale_id' => $sale->id,
                            'cost_diff' => $costDiff,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                Log::info('Recalculated sale profit by sale number', [
                    'sale_id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'old_total_cost' => $sale->total_cost - $costDiff,
                    'new_total_cost' => $sale->total_cost,
                    'old_total_profit' => $sale->total_profit - $profitDiff,
                    'new_total_profit' => $sale->total_profit,
                    'cost_diff' => $costDiff,
                    'profit_diff' => $profitDiff,
                ]);
            });

            $this->info("\n✓ Changes applied successfully!");
        } else {
            $this->warn("\nChanges cancelled by user.");
        }

        return 0;
    }

    /**
     * Recalculate a single sale detail using current FIFO cost
     */
    private function recalculateDetail(SaleDetail $detail): array
    {
        $oldCost = (float) $detail->cost;
        $oldProfit = (float) $detail->profit;

        // Calculate base quantity
        $conversion = $detail->itemUom ? (float) $detail->itemUom->conversion_value : 1;
        if ($conversion < 1) $conversion = 1;
        $baseQuantity = (float) $detail->quantity * $conversion;

        // Get current weighted average HPP from FIFO mappings
        $newCost = 0;
        
        if ($detail->fifoMappings->isNotEmpty()) {
            // Use existing FIFO mappings to get actual cost
            foreach ($detail->fifoMappings as $mapping) {
                if ($mapping->stockMovement) {
                    // Use the current unit_cost from stock movement (which may have been adjusted)
                    $currentUnitCost = (float) $mapping->stockMovement->unit_cost;
                    $newCost += $mapping->quantity_consumed * $currentUnitCost;
                } else {
                    // Estimated mapping, use mapping's own cost
                    $newCost += (float) $mapping->total_cost;
                }
            }
        } else {
            // No mappings, calculate using current average HPP
            $avgHpp = $this->getCurrentHpp($detail->item_id);
            $newCost = $baseQuantity * $avgHpp;
        }

        $newProfit = (float) $detail->subtotal - $newCost;
        $profitDiff = $newProfit - $oldProfit;

        $changed = abs($profitDiff) > 0.01;

        return [
            'detail_id' => $detail->id,
            'changed' => $changed,
            'old_cost' => $oldCost,
            'new_cost' => $newCost,
            'old_profit' => $oldProfit,
            'new_profit' => $newProfit,
            'profit_diff' => $profitDiff,
        ];
    }

    /**
     * Get current average HPP for an item
     */
    private function getCurrentHpp(int $itemId): float
    {
        $movements = StockMovement::where('item_id', $itemId)
            ->where('remaining_quantity', '>', 0)
            ->where('quantity', '>', 0)
            ->get();

        if ($movements->isEmpty()) {
            $item = \App\Models\Item::find($itemId);
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
}
