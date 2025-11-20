<?php

namespace App\Services;

use App\Models\Item;
use App\Models\ItemUom;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\FifoMapping;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StockService
{
    /**
     * Confirm purchase - add stock and create stock movements
     */
    public function confirmPurchase(Purchase $purchase): void
    {
        DB::transaction(function () use ($purchase) {
            $purchase->loadMissing(['details.item', 'details.itemUom']);

            foreach ($purchase->details as $detail) {
                if (!$detail->item || !$detail->itemUom) {
                    Log::warning('Skip purchase detail without item or UOM', ['purchase_detail_id' => $detail->id]);
                    continue;
                }

                $baseQuantity = $this->convertToBaseUom((float) $detail->quantity, $detail->itemUom);

                if ($baseQuantity <= 0) {
                    Log::warning('Purchase detail with non-positive base quantity skipped', ['purchase_detail_id' => $detail->id]);
                    continue;
                }

                $totalCostInBaseUom = (float) $detail->subtotal;
                $unitCost = $baseQuantity > 0 ? $totalCostInBaseUom / $baseQuantity : 0;

                StockMovement::create([
                    'item_id'            => $detail->item_id,
                    'reference_type'     => 'Purchase',
                    'reference_id'       => $purchase->id,
                    'quantity'           => $baseQuantity,
                    'unit_cost'          => $unitCost,
                    'remaining_quantity' => $baseQuantity,
                    'movement_date'      => $purchase->purchase_date,
                    'notes'              => "Purchase #{$purchase->purchase_number}",
                ]);

                $detail->item->increment('stock', $baseQuantity);
            }

            $purchase->update(['status' => 'confirmed']);
        });
    }

    /**
     * Unconfirm purchase - remove stock and delete stock movements
     */
    public function unconfirmPurchase(Purchase $purchase): void
    {
        DB::transaction(function () use ($purchase) {
            $purchase->loadMissing(['details.item', 'details.itemUom']);

            $movements = StockMovement::where('reference_type', 'Purchase')
                ->where('reference_id', $purchase->id)
                ->get();

            foreach ($movements as $movement) {
                $item = $movement->item;
                if ($item) {
                    $item->decrement('stock', $movement->quantity);
                }
                $movement->delete();
            }

            $purchase->update(['status' => 'pending']);
        });
    }

    /**
     * Confirm sale - deduct stock using FIFO and calculate cost
     */
    public function confirmSale(Sale $sale): void
    {
        DB::transaction(function () use ($sale) {
            $sale->loadMissing(['details.item', 'details.itemUom']);

            $totalCost = 0;

            foreach ($sale->details as $detail) {
                if (!$detail->item || !$detail->itemUom) {
                    Log::warning('Skip sale detail without item or UOM', ['sale_detail_id' => $detail->id]);
                    continue;
                }

                $baseQuantity = $this->convertToBaseUom((float) $detail->quantity, $detail->itemUom);

                if ($baseQuantity <= 0) {
                    Log::warning('Sale detail with non-positive base quantity skipped', ['sale_detail_id' => $detail->id]);
                    continue;
                }

                // Calculate FIFO cost and get mappings
                $fifoResult = $this->calculateFifoCostWithMappings($detail->item_id, $baseQuantity, $sale->sale_date);
                $cost = $fifoResult['total_cost'];
                $mappings = $fifoResult['mappings'];

                // Create FIFO mappings for audit trail
                foreach ($mappings as $mapping) {
                    FifoMapping::create([
                        'reference_type'      => 'Sale',
                        'reference_detail_id' => $detail->id,
                        'stock_movement_id'   => $mapping['movement_id'],
                        'quantity_consumed'   => $mapping['quantity'],
                        'unit_cost'           => $mapping['unit_cost'],
                        'total_cost'          => $mapping['total_cost'],
                    ]);
                }

                $detail->update([
                    'cost'   => $cost,
                    'profit' => $detail->subtotal - $cost,
                ]);

                $totalCost += $cost;

                StockMovement::create([
                    'item_id'            => $detail->item_id,
                    'reference_type'     => 'Sale',
                    'reference_id'       => $sale->id,
                    'quantity'           => -$baseQuantity,
                    'unit_cost'          => $baseQuantity > 0 ? $cost / $baseQuantity : 0,
                    'remaining_quantity' => 0,
                    'movement_date'      => $sale->sale_date,
                    'notes'              => "Sale #{$sale->sale_number}",
                ]);

                $detail->item->decrement('stock', $baseQuantity);
            }

            $sale->update([
                'status'       => 'confirmed',
                'total_cost'   => $totalCost,
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
            $sale->loadMissing(['details.item', 'details.itemUom', 'details.fifoMappings.stockMovement']);

            // Restore FIFO quantities using mappings (accurate restoration)
            foreach ($sale->details as $detail) {
                if (!$detail->item || !$detail->itemUom) {
                    continue;
                }

                // Restore using FIFO mappings for accuracy
                foreach ($detail->fifoMappings as $mapping) {
                    $movement = $mapping->stockMovement;
                    if ($movement) {
                        $movement->increment('remaining_quantity', $mapping->quantity_consumed);
                    }
                }

                // Delete FIFO mappings
                $detail->fifoMappings()->delete();

                $baseQuantity = $this->convertToBaseUom((float) $detail->quantity, $detail->itemUom);
                if ($baseQuantity > 0) {
                    $detail->item->increment('stock', $baseQuantity);
                }

                $detail->update([
                    'cost'   => 0,
                    'profit' => 0,
                ]);
            }

            // Delete sale stock movements
            StockMovement::where('reference_type', 'Sale')
                ->where('reference_id', $sale->id)
                ->delete();

            $sale->update([
                'status'       => 'pending',
                'total_cost'   => 0,
                'total_profit' => 0,
            ]);
        });
    }

    /**
     * Calculate FIFO cost and return mappings for audit trail
     */
    private function calculateFifoCostWithMappings(int $itemId, float $quantity, $date): array
    {
        $remainingQty = $quantity;
        $totalCost = 0;
        $mappings = [];

        // Get stock movements dengan remaining quantity > 0, FIFO order (oldest first)
        $movements = StockMovement::where('item_id', $itemId)
            ->where('remaining_quantity', '>', 0)
            ->where('quantity', '>', 0) // Only inbound movements
            ->where('movement_date', '<=', $date)
            ->orderBy('movement_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        foreach ($movements as $movement) {
            if ($remainingQty <= 0) break;

            $qtyToUse = min($remainingQty, $movement->remaining_quantity);
            $costForThisMovement = $qtyToUse * $movement->unit_cost;
            $totalCost += $costForThisMovement;

            // Store mapping for audit trail
            $mappings[] = [
                'movement_id' => $movement->id,
                'quantity'    => $qtyToUse,
                'unit_cost'   => $movement->unit_cost,
                'total_cost'  => $costForThisMovement,
            ];

            // Update remaining quantity
            $movement->decrement('remaining_quantity', $qtyToUse);

            $remainingQty -= $qtyToUse;
        }

        // Jika masih ada remaining (stock tidak cukup), gunakan avg cost
        if ($remainingQty > 0) {
            $avgCost = $this->getAverageCost($itemId);
            $avgCostTotal = $remainingQty * $avgCost;
            $totalCost += $avgCostTotal;

            // Log warning for insufficient stock
            Log::warning('Insufficient stock for FIFO, using average cost', [
                'item_id'      => $itemId,
                'quantity'     => $remainingQty,
                'avg_cost'     => $avgCost,
            ]);
        }

        return [
            'total_cost' => $totalCost,
            'mappings'   => $mappings,
        ];
    }

    /**
     * Calculate FIFO cost untuk item dengan quantity tertentu (legacy method for adjustments)
     */
    private function calculateFifoCost(int $itemId, float $quantity, $date): float
    {
        $result = $this->calculateFifoCostWithMappings($itemId, $quantity, $date);
        return $result['total_cost'];
    }

    /**
     * Restore FIFO quantities saat unconfirm sale (DEPRECATED - now using mappings)
     */
    private function restoreFifoQuantities(Sale $sale): void
    {
        // This method is now deprecated - unconfirmSale uses FIFO mappings directly
        // Keeping for backward compatibility but should not be called
        Log::warning('restoreFifoQuantities called but should use FIFO mappings instead');
    }

    /**
     * Convert quantity from UOM to base UOM
     */
    private function convertToBaseUom(float $quantity, ItemUom $uom): float
    {
        $conversion = (int) $uom->conversion_value;
        if ($conversion < 1) {
            $conversion = 1;
        }

        return $quantity * $conversion;
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

    /**
     * Remove stock movements for returns (when unconfirm)
     */
    public function removeReturnStock(string $referenceType, int $referenceId): void
    {
        $movements = StockMovement::where('reference_type', $referenceType)
            ->where('reference_id', $referenceId)
            ->get();

        foreach ($movements as $movement) {
            $item = Item::find($movement->item_id);

            // Adjust stock based on movement quantity
            if ($movement->quantity > 0) {
                // Was an inbound movement (purchase return), remove it
                $item->stock -= $movement->quantity;
            } else {
                // Was an outbound movement (sale return), remove it
                $item->stock -= $movement->quantity; // Double negative = add back
            }

            $item->save();

            // Delete the movement
            $movement->delete();
        }
    }

    /**
     * Confirm purchase return - deduct stock using FIFO and create mappings
     */
    public function confirmPurchaseReturn($purchaseReturn): void
    {
        DB::transaction(function () use ($purchaseReturn) {
            $purchaseReturn->loadMissing(['details.item', 'details.itemUom']);

            foreach ($purchaseReturn->details as $detail) {
                if (!$detail->item || !$detail->itemUom) {
                    Log::warning('Skip purchase return detail without item or UOM', ['detail_id' => $detail->id]);
                    continue;
                }

                $baseQuantity = $this->convertToBaseUom((float) $detail->quantity, $detail->itemUom);

                if ($baseQuantity <= 0) {
                    Log::warning('Purchase return detail with non-positive base quantity skipped', ['detail_id' => $detail->id]);
                    continue;
                }

                // Calculate FIFO cost and get mappings (consume from oldest stock)
                $fifoResult = $this->calculateFifoCostWithMappings($detail->item_id, $baseQuantity, $purchaseReturn->return_date);
                $mappings = $fifoResult['mappings'];

                // Create FIFO mappings for audit trail
                foreach ($mappings as $mapping) {
                    FifoMapping::create([
                        'reference_type'      => 'PurchaseReturn',
                        'reference_detail_id' => $detail->id,
                        'stock_movement_id'   => $mapping['movement_id'],
                        'quantity_consumed'   => $mapping['quantity'],
                        'unit_cost'           => $mapping['unit_cost'],
                        'total_cost'          => $mapping['total_cost'],
                    ]);
                }

                // Create stock movement (OUT - negative quantity)
                StockMovement::create([
                    'item_id'            => $detail->item_id,
                    'reference_type'     => 'PurchaseReturn',
                    'reference_id'       => $purchaseReturn->id,
                    'quantity'           => -$baseQuantity,
                    'unit_cost'          => $baseQuantity > 0 ? $fifoResult['total_cost'] / $baseQuantity : 0,
                    'remaining_quantity' => 0,
                    'movement_date'      => $purchaseReturn->return_date,
                    'notes'              => "Purchase Return #{$purchaseReturn->return_number}",
                ]);

                $detail->item->decrement('stock', $baseQuantity);
            }

            $purchaseReturn->update(['status' => 'confirmed']);
        });
    }

    /**
     * Unconfirm purchase return - restore stock using mappings
     */
    public function unconfirmPurchaseReturn($purchaseReturn): void
    {
        DB::transaction(function () use ($purchaseReturn) {
            $purchaseReturn->loadMissing(['details.item', 'details.itemUom', 'details.fifoMappings.stockMovement']);

            // Restore FIFO quantities using mappings (accurate restoration)
            foreach ($purchaseReturn->details as $detail) {
                if (!$detail->item || !$detail->itemUom) {
                    continue;
                }

                // Restore using FIFO mappings for accuracy
                foreach ($detail->fifoMappings as $mapping) {
                    $movement = $mapping->stockMovement;
                    if ($movement) {
                        $movement->increment('remaining_quantity', $mapping->quantity_consumed);
                    }
                }

                // Delete FIFO mappings
                $detail->fifoMappings()->delete();

                $baseQuantity = $this->convertToBaseUom((float) $detail->quantity, $detail->itemUom);
                if ($baseQuantity > 0) {
                    $detail->item->increment('stock', $baseQuantity);
                }
            }

            // Delete purchase return stock movements
            StockMovement::where('reference_type', 'PurchaseReturn')
                ->where('reference_id', $purchaseReturn->id)
                ->delete();

            $purchaseReturn->update(['status' => 'pending']);
        });
    }

    /**
     * Confirm sale return - restore stock using original sale's FIFO mappings
     */
    public function confirmSaleReturn($saleReturn): void
    {
        DB::transaction(function () use ($saleReturn) {
            $saleReturn->loadMissing(['details.item', 'details.itemUom', 'details.saleDetail.fifoMappings.stockMovement']);

            $totalCost = 0;
            $totalProfitAdjustment = 0;

            foreach ($saleReturn->details as $detail) {
                if (!$detail->item || !$detail->itemUom) {
                    Log::warning('Skip sale return detail without item or UOM', ['detail_id' => $detail->id]);
                    continue;
                }

                $baseQuantity = $this->convertToBaseUom((float) $detail->quantity, $detail->itemUom);

                if ($baseQuantity <= 0) {
                    Log::warning('Sale return detail with non-positive base quantity skipped', ['detail_id' => $detail->id]);
                    continue;
                }

                // Get original sale detail's FIFO mappings to restore the same stock movements
                $originalSaleDetail = $detail->saleDetail;
                $restoredCost = 0;

                if ($originalSaleDetail && $originalSaleDetail->fifoMappings()->exists()) {
                    // Restore stock movements from original sale (in reverse order - LIFO for returns)
                    $originalMappings = $originalSaleDetail->fifoMappings()
                        ->orderByDesc('id')
                        ->get();

                    $remainingQty = $baseQuantity;

                    foreach ($originalMappings as $originalMapping) {
                        if ($remainingQty <= 0) break;

                        $originalMovement = $originalMapping->stockMovement;
                        if (!$originalMovement) continue;

                        // Restore up to the quantity that was originally consumed
                        $qtyToRestore = min($remainingQty, $originalMapping->quantity_consumed);

                        // Create new stock movement with original cost
                        $newMovement = StockMovement::create([
                            'item_id'            => $detail->item_id,
                            'reference_type'     => 'SaleReturn',
                            'reference_id'       => $saleReturn->id,
                            'quantity'           => $qtyToRestore,
                            'unit_cost'          => $originalMapping->unit_cost,
                            'remaining_quantity' => $qtyToRestore,
                            'movement_date'      => $saleReturn->return_date,
                            'notes'              => "Sale Return #{$saleReturn->return_number} - Restored from Sale",
                        ]);

                        // Create FIFO mapping for audit trail
                        FifoMapping::create([
                            'reference_type'      => 'SaleReturn',
                            'reference_detail_id' => $detail->id,
                            'stock_movement_id'   => $newMovement->id,
                            'quantity_consumed'   => $qtyToRestore,
                            'unit_cost'           => $originalMapping->unit_cost,
                            'total_cost'          => $qtyToRestore * $originalMapping->unit_cost,
                        ]);

                        $restoredCost += $qtyToRestore * $originalMapping->unit_cost;
                        $remainingQty -= $qtyToRestore;
                    }

                    // If we couldn't restore all from original mappings (partial return), use average cost
                    if ($remainingQty > 0) {
                        $avgCost = $this->getAverageCost($detail->item_id);
                        $avgCostTotal = $remainingQty * $avgCost;
                        $restoredCost += $avgCostTotal;

                        $newMovement = StockMovement::create([
                            'item_id'            => $detail->item_id,
                            'reference_type'     => 'SaleReturn',
                            'reference_id'       => $saleReturn->id,
                            'quantity'           => $remainingQty,
                            'unit_cost'          => $avgCost,
                            'remaining_quantity' => $remainingQty,
                            'movement_date'      => $saleReturn->return_date,
                            'notes'              => "Sale Return #{$saleReturn->return_number} - Partial return (avg cost)",
                        ]);

                        FifoMapping::create([
                            'reference_type'      => 'SaleReturn',
                            'reference_detail_id' => $detail->id,
                            'stock_movement_id'   => $newMovement->id,
                            'quantity_consumed'   => $remainingQty,
                            'unit_cost'           => $avgCost,
                            'total_cost'          => $avgCostTotal,
                        ]);
                    }
                } else {
                    // No original sale detail found, use average cost
                    $avgCost = $this->getAverageCost($detail->item_id);
                    $restoredCost = $baseQuantity * $avgCost;

                    $newMovement = StockMovement::create([
                        'item_id'            => $detail->item_id,
                        'reference_type'     => 'SaleReturn',
                        'reference_id'       => $saleReturn->id,
                        'quantity'           => $baseQuantity,
                        'unit_cost'          => $avgCost,
                        'remaining_quantity' => $baseQuantity,
                        'movement_date'      => $saleReturn->return_date,
                        'notes'              => "Sale Return #{$saleReturn->return_number} - No original sale found (avg cost)",
                    ]);

                    FifoMapping::create([
                        'reference_type'      => 'SaleReturn',
                        'reference_detail_id' => $detail->id,
                        'stock_movement_id'   => $newMovement->id,
                        'quantity_consumed'   => $baseQuantity,
                        'unit_cost'           => $avgCost,
                        'total_cost'          => $restoredCost,
                    ]);
                }

                // Update item stock
                $detail->item->increment('stock', $baseQuantity);

                // Calculate profit adjustment (negative because we're returning)
                $profitAdjustment = $detail->subtotal - $restoredCost;

                $detail->update([
                    'cost'             => $restoredCost,
                    'profit_adjustment' => $profitAdjustment,
                ]);

                $totalCost += $restoredCost;
                $totalProfitAdjustment += $profitAdjustment;
            }

            $saleReturn->update([
                'status'               => 'confirmed',
                'total_cost'           => $totalCost,
                'total_profit_adjustment' => $totalProfitAdjustment,
            ]);
        });
    }

    /**
     * Unconfirm sale return - remove restored stock using mappings
     */
    public function unconfirmSaleReturn($saleReturn): void
    {
        DB::transaction(function () use ($saleReturn) {
            $saleReturn->loadMissing(['details.item', 'details.itemUom', 'details.fifoMappings.stockMovement']);

            // Remove restored stock movements using FIFO mappings
            foreach ($saleReturn->details as $detail) {
                if (!$detail->item || !$detail->itemUom) {
                    continue;
                }

                // Delete stock movements created by this return
                foreach ($detail->fifoMappings as $mapping) {
                    $movement = $mapping->stockMovement;
                    if ($movement) {
                        $movement->delete();
                    }
                }

                // Delete FIFO mappings
                $detail->fifoMappings()->delete();

                $baseQuantity = $this->convertToBaseUom((float) $detail->quantity, $detail->itemUom);
                if ($baseQuantity > 0) {
                    $detail->item->decrement('stock', $baseQuantity);
                }

                $detail->update([
                    'cost'             => 0,
                    'profit_adjustment' => 0,
                ]);
            }

            $saleReturn->update([
                'status'               => 'pending',
                'total_cost'           => 0,
                'total_profit_adjustment' => 0,
            ]);
        });
    }

    public function consumeForAdjustment(Item $item, float $quantity, array $context = []): void
    {
        if ($quantity <= 0) {
            return;
        }

        $consumptionCost = $this->calculateFifoCost($item->id, $quantity, now());
        $unitCost = $quantity > 0 ? $consumptionCost / $quantity : 0;

        $movementData = [
            'item_id'            => $item->id,
            'reference_type'     => $context['reference_type'] ?? 'Adjustment',
            'reference_id'       => $context['reference_id'] ?? $item->id,
            'quantity'           => -$quantity,
            'unit_cost'          => $context['unit_cost'] ?? $unitCost,
            'remaining_quantity' => 0,
            'movement_date'      => $context['movement_date'] ?? now(),
            'notes'              => $context['notes'] ?? 'Penyesuaian stok manual (OUT)',
        ];

        StockMovement::create($movementData);

        $item->decrement('stock', $quantity);
    }

    /**
     * Create stock adjustment (increase or decrease stock)
     */
    public function adjustStock(Item $item, float $quantity, float $unitCost, $adjustmentDate, string $notes = ''): void
    {
        if ($quantity == 0) {
            return;
        }

        DB::transaction(function () use ($item, $quantity, $unitCost, $adjustmentDate, $notes) {
            if ($quantity > 0) {
                // Increase stock - add stock movement
                StockMovement::create([
                    'item_id'            => $item->id,
                    'reference_type'     => 'StockAdjustment',
                    'reference_id'       => $item->id,
                    'quantity'           => $quantity,
                    'unit_cost'          => $unitCost,
                    'remaining_quantity' => $quantity,
                    'movement_date'      => $adjustmentDate,
                    'notes'              => $notes ?: 'Penyesuaian stok (IN)',
                ]);

                $item->increment('stock', $quantity);
            } else {
                // Decrease stock - use FIFO consumption
                $absQuantity = abs($quantity);
                $consumptionCost = $this->calculateFifoCost($item->id, $absQuantity, $adjustmentDate);
                $avgUnitCost = $absQuantity > 0 ? $consumptionCost / $absQuantity : $unitCost;

                // Create consumption movement
                StockMovement::create([
                    'item_id'            => $item->id,
                    'reference_type'     => 'StockAdjustment',
                    'reference_id'       => $item->id,
                    'quantity'           => -$absQuantity,
                    'unit_cost'          => $avgUnitCost,
                    'remaining_quantity' => 0,
                    'movement_date'      => $adjustmentDate,
                    'notes'              => $notes ?: 'Penyesuaian stok (OUT)',
                ]);

                $item->decrement('stock', $absQuantity);
            }
        });
    }
}

