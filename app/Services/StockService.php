<?php

namespace App\Services;

use App\Models\Item;
use App\Models\ItemUom;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Confirm purchase - add stock and create stock movements
     */
    public function confirmPurchase(Purchase $purchase): void
    {
        DB::transaction(function () use ($purchase) {
            foreach ($purchase->details as $detail) {
                // Convert quantity to base UOM
                $baseQuantity = $this->convertToBaseUom($detail->quantity, $detail->itemUom);

                // Calculate unit cost in base UOM
                $totalCostInBaseUom = $detail->subtotal;
                $unitCost = $baseQuantity > 0 ? $totalCostInBaseUom / $baseQuantity : 0;

                // Create stock movement (IN)
                StockMovement::create([
                    'item_id' => $detail->item_id,
                    'reference_type' => 'Purchase',
                    'reference_id' => $purchase->id,
                    'quantity' => $baseQuantity, // Positive untuk masuk
                    'unit_cost' => $unitCost,
                    'remaining_quantity' => $baseQuantity, // Untuk FIFO tracking
                    'movement_date' => $purchase->purchase_date,
                    'notes' => "Purchase #{$purchase->purchase_number}",
                ]);

                // Update item stock
                $detail->item->increment('stock', $baseQuantity);
            }

            // Update purchase status
            $purchase->update(['status' => 'confirmed']);
        });
    }

    /**
     * Unconfirm purchase - remove stock and delete stock movements
     */
    public function unconfirmPurchase(Purchase $purchase): void
    {
        DB::transaction(function () use ($purchase) {
            // Delete stock movements
            StockMovement::where('reference_type', 'Purchase')
                ->where('reference_id', $purchase->id)
                ->delete();

            // Restore stock
            foreach ($purchase->details as $detail) {
                $baseQuantity = $this->convertToBaseUom($detail->quantity, $detail->itemUom);
                $detail->item->decrement('stock', $baseQuantity);
            }

            // Update purchase status
            $purchase->update(['status' => 'pending']);
        });
    }

    /**
     * Confirm sale - deduct stock using FIFO and calculate cost
     */
    public function confirmSale(Sale $sale): void
    {
        DB::transaction(function () use ($sale) {
            $totalCost = 0;

            foreach ($sale->details as $detail) {
                // Convert quantity to base UOM
                $baseQuantity = $this->convertToBaseUom($detail->quantity, $detail->itemUom);

                // Calculate cost using FIFO
                $cost = $this->calculateFifoCost($detail->item_id, $baseQuantity, $sale->sale_date);

                // Update detail dengan cost dan profit
                $detail->update([
                    'cost' => $cost,
                    'profit' => $detail->subtotal - $cost,
                ]);

                $totalCost += $cost;

                // Create stock movement (OUT)
                StockMovement::create([
                    'item_id' => $detail->item_id,
                    'reference_type' => 'Sale',
                    'reference_id' => $sale->id,
                    'quantity' => -$baseQuantity, // Negative untuk keluar
                    'unit_cost' => $baseQuantity > 0 ? $cost / $baseQuantity : 0,
                    'remaining_quantity' => 0, // Sudah terpakai semua
                    'movement_date' => $sale->sale_date,
                    'notes' => "Sale #{$sale->sale_number}",
                ]);

                // Update item stock
                $detail->item->decrement('stock', $baseQuantity);
            }

            // Update sale dengan total cost dan profit
            $sale->update([
                'status' => 'confirmed',
                'total_cost' => $totalCost,
                'total_profit' => $sale->total_amount - $totalCost,
            ]);
        });
    }

    /**
     * Unconfirm sale - restore stock and delete stock movements
     */
    public function unconfirmSale(Sale $sale): void
    {
        DB::transaction(function () use ($sale) {
            // Restore remaining quantity di stock movements yang terpakai
            $this->restoreFifoQuantities($sale);

            // Delete stock movements untuk sale ini
            StockMovement::where('reference_type', 'Sale')
                ->where('reference_id', $sale->id)
                ->delete();

            // Restore stock
            foreach ($sale->details as $detail) {
                $baseQuantity = $this->convertToBaseUom($detail->quantity, $detail->itemUom);
                $detail->item->increment('stock', $baseQuantity);

                // Reset cost dan profit
                $detail->update([
                    'cost' => 0,
                    'profit' => 0,
                ]);
            }

            // Update sale status dan reset totals
            $sale->update([
                'status' => 'pending',
                'total_cost' => 0,
                'total_profit' => 0,
            ]);
        });
    }

    /**
     * Calculate FIFO cost untuk item dengan quantity tertentu
     */
    private function calculateFifoCost(int $itemId, float $quantity, $date): float
    {
        $remainingQty = $quantity;
        $totalCost = 0;

        // Get stock movements dengan remaining quantity > 0, FIFO order (oldest first)
        $movements = StockMovement::where('item_id', $itemId)
            ->where('remaining_quantity', '>', 0)
            ->where('movement_date', '<=', $date)
            ->orderBy('movement_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        foreach ($movements as $movement) {
            if ($remainingQty <= 0) break;

            $qtyToUse = min($remainingQty, $movement->remaining_quantity);
            $totalCost += $qtyToUse * $movement->unit_cost;

            // Update remaining quantity
            $movement->decrement('remaining_quantity', $qtyToUse);

            $remainingQty -= $qtyToUse;
        }

        // Jika masih ada remaining (stock tidak cukup), gunakan avg cost
        if ($remainingQty > 0) {
            $avgCost = $this->getAverageCost($itemId);
            $totalCost += $remainingQty * $avgCost;
        }

        return $totalCost;
    }

    /**
     * Restore FIFO quantities saat unconfirm sale
     */
    private function restoreFifoQuantities(Sale $sale): void
    {
        foreach ($sale->details as $detail) {
            $baseQuantity = $this->convertToBaseUom($detail->quantity, $detail->itemUom);
            $remainingQty = $baseQuantity;

            // Get stock movements yang dipakai (oldest first)
            $movements = StockMovement::where('item_id', $detail->item_id)
                ->where('quantity', '>', 0) // Only IN movements
                ->where('movement_date', '<=', $sale->sale_date)
                ->orderBy('movement_date', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            foreach ($movements as $movement) {
                if ($remainingQty <= 0) break;

                $qtyToRestore = min($remainingQty, $baseQuantity);
                $movement->increment('remaining_quantity', $qtyToRestore);
                $remainingQty -= $qtyToRestore;
            }
        }
    }

    /**
     * Convert quantity from UOM to base UOM
     */
    private function convertToBaseUom(float $quantity, ItemUom $uom): float
    {
        return $quantity * $uom->conversion_value;
    }

    /**
     * Get average cost untuk fallback
     */
    private function getAverageCost(int $itemId): float
    {
        $avg = StockMovement::where('item_id', $itemId)
            ->where('remaining_quantity', '>', 0)
            ->avg('unit_cost');

        return $avg ?? 0;
    }

    /**
     * Get current stock value using FIFO
     */
    public function getCurrentStockValue(int $itemId): float
    {
        $movements = StockMovement::where('item_id', $itemId)
            ->where('remaining_quantity', '>', 0)
            ->get();

        $value = 0;
        foreach ($movements as $movement) {
            $value += $movement->remaining_quantity * $movement->unit_cost;
        }

        return $value;
    }
}

