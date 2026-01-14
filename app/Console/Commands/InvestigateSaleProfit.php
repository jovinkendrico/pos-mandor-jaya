<?php

namespace App\Console\Commands;

use App\Models\Sale;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class InvestigateSaleProfit extends Command
{
    protected $signature = 'sales:investigate {sale_number}';
    protected $description = 'Investigate sale profit calculation details';

    public function handle()
    {
        $saleNumber = $this->argument('sale_number');

        $this->info("=== Investigating Sale: {$saleNumber} ===\n");

        // Get sale
        $sale = Sale::where('sale_number', $saleNumber)
            ->with(['details.item', 'details.itemUom', 'details.fifoMappings.stockMovement'])
            ->first();

        if (!$sale) {
            $this->error("Sale not found!");
            return 1;
        }

        $this->info("Sale ID: {$sale->id}");
        $this->info("Status: {$sale->status}");
        $this->info("Date: {$sale->sale_date}");
        $this->info("Total Cost: " . number_format($sale->total_cost, 2));
        $this->info("Total Profit: " . number_format($sale->total_profit, 2));
        $this->newLine();

        foreach ($sale->details as $detail) {
            $this->info("--- Detail #{$detail->id}: {$detail->item->name} ---");
            $uomName = $detail->itemUom->uom->name ?? '';
            $this->info("Quantity: {$detail->quantity} {$uomName}");
            $this->info("Subtotal: " . number_format($detail->subtotal, 2));
            $this->info("Cost: " . number_format($detail->cost, 2));
            $this->info("Profit: " . number_format($detail->profit, 2));
            $this->newLine();

            // Show FIFO mappings
            $this->info("FIFO Mappings:");
            if ($detail->fifoMappings->isEmpty()) {
                $this->warn("  No FIFO mappings found!");
            } else {
                $totalMappedCost = 0;
                foreach ($detail->fifoMappings as $mapping) {
                    $movement = $mapping->stockMovement;
                    if ($movement) {
                        $this->line(sprintf(
                            "  Mapping #%d: Qty %.2f × HPP %.2f = %.2f (Stock Movement #%d, Date: %s)",
                            $mapping->id,
                            $mapping->quantity_consumed,
                            $movement->unit_cost,
                            $mapping->quantity_consumed * $movement->unit_cost,
                            $movement->id,
                            $movement->movement_date
                        ));
                        $totalMappedCost += $mapping->quantity_consumed * $movement->unit_cost;
                    } else {
                        $this->line(sprintf(
                            "  Mapping #%d: Qty %.2f × HPP %.2f = %.2f (ESTIMATED - No Stock Movement)",
                            $mapping->id,
                            $mapping->quantity_consumed,
                            $mapping->unit_cost,
                            $mapping->total_cost
                        ));
                        $totalMappedCost += $mapping->total_cost;
                    }
                }
                $this->info("  Total from mappings: " . number_format($totalMappedCost, 2));
                $this->info("  Recorded cost: " . number_format($detail->cost, 2));
                $diff = $totalMappedCost - $detail->cost;
                if (abs($diff) > 0.01) {
                    $this->error("  DIFFERENCE: " . number_format($diff, 2));
                } else {
                    $this->info("  ✓ Cost matches mappings");
                }
            }
            $this->newLine();

            // Show current stock movements for this item
            $this->info("Current Stock Movements for this item:");
            $movements = DB::table('stock_movements')
                ->where('item_id', $detail->item_id)
                ->where('remaining_quantity', '>', 0)
                ->where('quantity', '>', 0)
                ->orderBy('movement_date', 'asc')
                ->get();

            if ($movements->isEmpty()) {
                $this->warn("  No stock movements with remaining quantity!");
            } else {
                foreach ($movements as $movement) {
                    $this->line(sprintf(
                        "  Movement #%d: %s | Qty: %.2f | Remaining: %.2f | HPP: %.2f | Date: %s | %s",
                        $movement->id,
                        $movement->reference_type,
                        $movement->quantity,
                        $movement->remaining_quantity,
                        $movement->unit_cost,
                        $movement->movement_date,
                        $movement->notes ?? ''
                    ));
                }

                // Calculate weighted average
                $totalValue = 0;
                $totalQty = 0;
                foreach ($movements as $movement) {
                    $totalValue += $movement->remaining_quantity * $movement->unit_cost;
                    $totalQty += $movement->remaining_quantity;
                }
                $weightedAvg = $totalQty > 0 ? $totalValue / $totalQty : 0;
                $this->info("  Weighted Average HPP: " . number_format($weightedAvg, 2));
            }
            $this->newLine();

            // Show recent stock adjustments for this item
            $this->info("Recent Stock Adjustments for this item:");
            $adjustments = DB::table('stock_movements')
                ->where('item_id', $detail->item_id)
                ->where('reference_type', 'StockAdjustment')
                ->orderBy('movement_date', 'desc')
                ->limit(5)
                ->get();

            if ($adjustments->isEmpty()) {
                $this->warn("  No stock adjustments found");
            } else {
                foreach ($adjustments as $adj) {
                    $this->line(sprintf(
                        "  Adjustment #%d: Qty: %.2f | HPP: %.2f | Date: %s | %s",
                        $adj->id,
                        $adj->quantity,
                        $adj->unit_cost,
                        $adj->movement_date,
                        $adj->notes ?? ''
                    ));
                }
            }
            $this->newLine();
            $this->line(str_repeat('=', 80));
            $this->newLine();
        }

        return 0;
    }
}
