<?php

namespace App\Services;

use App\Models\Item;
use App\Models\ItemUom;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\FifoMapping;
use App\Services\JournalService;
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
                $unitCost           = $baseQuantity > 0 ? $totalCostInBaseUom / $baseQuantity : 0;

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
                $this->reconcileNegativeStock($detail->item_id);
            }

            $purchase->update([
                'status'     => 'confirmed',
                'updated_by' => auth()->id(),
            ]);

            // Post to journal
            try {
                app(JournalService::class)->postPurchase($purchase);
            } catch (\Exception $e) {
                Log::error('Failed to post purchase to journal', [
                    'purchase_id' => $purchase->id,
                    'error'       => $e->getMessage(),
                ]);
                // Don't throw - allow purchase to be confirmed even if journal posting fails
            }
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
                // 1. Handle Sales linked to this purchase (De-Reconciliation)
                // This prevents the need for global "Reprocess All" by locally fixing affected sales
                $mappings = FifoMapping::where('stock_movement_id', $movement->id)->get();
                
                foreach ($mappings as $mapping) {
                    // Only handle Sales logic for now
                    if ($mapping->reference_type !== 'Sale') {
                        $mapping->delete();
                        continue;
                    }

                    $detail = \App\Models\SaleDetail::find($mapping->reference_detail_id);
                    if ($detail) {
                        // Determine Fallback Cost (to use as new Estimated Cost)
                        // We must exclude the CURRENT Purchase from this check as it is being deleted
                        $fallbackCost = 0;
                        
                        // Try last valid movement EXCLUDING this purchase
                        $lastValid = StockMovement::where('item_id', $detail->item_id)
                            ->where('unit_cost', '>', 0)
                            ->whereNot(function($q) use ($purchase) {
                                $q->where('reference_type', 'Purchase')
                                  ->where('reference_id', $purchase->id);
                            })
                            ->orderBy('movement_date', 'desc')
                            ->orderBy('id', 'desc')
                            ->first();

                        if ($lastValid) {
                            $fallbackCost = (float)$lastValid->unit_cost;
                        } elseif ($detail->item && $detail->item->modal_price > 0) {
                            $fallbackCost = (float)$detail->item->modal_price;
                        }

                        // Calculate Diff
                        $revertedTotalCost = $fallbackCost * $mapping->quantity_consumed;
                        $originalTotalCost = $mapping->total_cost;
                        $costDiff = $revertedTotalCost - $originalTotalCost;

                        // Apply Diff to Sales
                        $detail->increment('cost', $costDiff);
                        $detail->decrement('profit', $costDiff);

                        $sale = $detail->sale;
                        if ($sale) {
                            $sale->increment('total_cost', $costDiff);
                            $sale->decrement('total_profit', $costDiff);

                            // Journal Adjustment for the reversal
                            if (abs($costDiff) > 0.01) {
                                try {
                                    app(JournalService::class)->adjustSaleCogs($sale, $costDiff);
                                } catch (\Exception $e) {}
                            }
                        }

                        // Convert Mapping to Estimated
                        $mapping->update([
                            'stock_movement_id' => null,
                            'unit_cost' => $fallbackCost,
                            'total_cost' => $revertedTotalCost,
                            'is_estimated' => true
                        ]);
                    } else {
                        // Orphaned mapping
                        $mapping->delete();
                    }
                }

                // 2. Standard Stock Reversal
                $item = $movement->item;
                if ($item) {
                    $item->decrement('stock', $movement->quantity);
                }
                $movement->delete();
            }

            $purchase->update([
                'status'     => 'pending',
                'updated_by' => auth()->id(),
            ]);

            // Reverse journal entry
            try {
                app(JournalService::class)->reversePurchase($purchase);
            } catch (\Exception $e) {
                Log::error('Failed to reverse purchase journal entry', [
                    'purchase_id' => $purchase->id,
                    'error'       => $e->getMessage(),
                ]);
                // Don't throw - allow unconfirm even if journal reversal fails
            }
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

                // Skip FIFO and stock for PINJAM TUNAI (ID 1525) & UANG JALAN (ID 1673)
                if (in_array($detail->item_id, [1525, 1673])) {
                    $detail->update([
                        'cost'   => 0,
                        'profit' => 0, // Profit is 0 for loans
                        'profit_status' => 'realized',
                    ]);
                    continue;
                }

                // Calculate FIFO cost and get mappings
                // This will THROW Exception if stock is insufficient (so we never confirm negative stock sales)
                $fifoResult = $this->calculateFifoCostWithMappings($detail->item_id, $baseQuantity, $sale->sale_date);
                $cost       = $fifoResult['total_cost'];
                $mappings   = $fifoResult['mappings'];

                // Create FIFO mappings for audit trail
                foreach ($mappings as $mapping) {
                    FifoMapping::create([
                        'reference_type'      => 'Sale',
                        'reference_detail_id' => $detail->id,
                        'stock_movement_id'   => $mapping['movement_id'],
                        'quantity_consumed'   => $mapping['quantity'],
                        'unit_cost'           => $mapping['unit_cost'],
                        'total_cost'          => $mapping['total_cost'],
                        'is_estimated'        => false, 
                    ]);
                }

                $profit = $detail->subtotal - $cost;
                
                $detail->update([
                    'cost'   => $cost,
                    'profit' => $profit,
                    'profit_status' => 'realized',
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

            // Calculate profit using total_after_discount (without PPN) - exclude loans from revenue
            $loanTotal = (float) $sale->details()->whereIn('item_id', [1525, 1673])->sum('subtotal');
            $revenue = (float) $sale->total_after_discount - $loanTotal;
            
            $sale->update([
                'status'       => 'confirmed',
                'total_cost'   => $totalCost,
                'total_profit' => $revenue - $totalCost, 
                'updated_by'   => auth()->id(),
            ]);

            // Post to journal
            try {
                app(JournalService::class)->postSale($sale);
            } catch (\Exception $e) {
                Log::error('Failed to post sale to journal', [
                    'sale_id' => $sale->id,
                    'error'   => $e->getMessage(),
                ]);
                // Don't throw - allow sale to be confirmed even if journal posting fails
            }
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

                // Skip PINJAM TUNAI (ID 1525) & UANG JALAN (ID 1673)
                if (in_array($detail->item_id, [1525, 1673])) {
                    $detail->update([
                        'cost'   => 0,
                        'profit' => 0,
                    ]);
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
                'updated_by'   => auth()->id(),
            ]);

            // Reverse journal entry
            try {
                app(JournalService::class)->reverseSale($sale);
            } catch (\Exception $e) {
                Log::error('Failed to reverse sale journal entry', [
                    'sale_id' => $sale->id,
                    'error'   => $e->getMessage(),
                ]);
                // Don't throw - allow unconfirm even if journal reversal fails
            }
        });
    }

    /**
     * Calculate FIFO cost and return mappings for audit trail
     */
    private function calculateFifoCostWithMappings(int $itemId, float $quantity, $date): array
    {
        $remainingQty = $quantity;
        $totalCost    = 0;
        $mappings     = [];

        // Get stock movements dengan remaining quantity > 0, FIFO order (oldest first)
        // NOTE: We REMOVED the date check (movement_date <= $date) to allow "backdated" sales to consume "future" stock.
        // This supports the workflow: Process ALL Purchases first (fill pool) -> Process ALL Sales.
        $movements = StockMovement::where('item_id', $itemId)
            ->where('remaining_quantity', '>', 0)
            ->where('quantity', '>', 0) // Only inbound movements
            ->orderBy('movement_date', 'asc')
            ->orderBy('id', 'asc')
            ->lockForUpdate()
            ->get();

        foreach ($movements as $movement) {
            if ($remainingQty <= 0) break;

            $qtyToUse             = min($remainingQty, (float)$movement->remaining_quantity);
            $costForThisMovement  = $qtyToUse * (float)$movement->unit_cost;
            $totalCost           += $costForThisMovement;

            // Store mapping for audit trail
            $mappings[] = [
                'movement_id' => $movement->id,
                'quantity'    => $qtyToUse,
                'unit_cost'   => (float)$movement->unit_cost,
                'total_cost'  => $costForThisMovement,
            ];

            // Update remaining quantity
            $movement->decrement('remaining_quantity', $qtyToUse);

            $remainingQty -= $qtyToUse;
        }

        // Jika masih ada remaining (stock tidak cukup / negatif)
        if ($remainingQty > 0.0001) {
             // STRICT MODE: Fail if stock is insufficient at this date
             $itemName = \App\Models\Item::find($itemId)?->name ?? "ID {$itemId}";
             
             // Friendly error message for user
             throw new \Exception("Stok tidak cukup untuk barang '{$itemName}'. Kurang: " . round($remainingQty, 2));
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
        $conversion = (float) $uom->conversion_value;
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

        if ($avg && $avg > 0) {
            return (float)$avg;
        }

        // Fallback 1: Manual Modal Price
        $item = \App\Models\Item::find($itemId);
        if ($item && $item->modal_price > 0) {
            return (float)$item->modal_price;
        }

        // Fallback 2: Last Valid Cost from any Stock Movement (Purchase, Adjustment, Opening)
        $lastMovement = StockMovement::where('item_id', $itemId)
            ->where('unit_cost', '>', 0)
            ->orderBy('movement_date', 'desc')
            ->orderBy('id', 'desc')
            ->first();
        
        if ($lastMovement) {
            return (float)$lastMovement->unit_cost;
        }

        return 0;
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
                $mappings   = $fifoResult['mappings'];

                // Create FIFO mappings for audit trail
                foreach ($mappings as $mapping) {
                    FifoMapping::create([
                        'reference_type'      => 'PurchaseReturn',
                        'reference_detail_id' => $detail->id,
                        'stock_movement_id'   => $mapping['movement_id'],
                        'quantity_consumed'   => $mapping['quantity'],
                        'unit_cost'           => $mapping['unit_cost'],
                        'total_cost'          => $mapping['total_cost'],
                        'is_estimated'        => $mapping['is_estimated'] ?? false,
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

            // Handle refund based on refund_method
            if ($purchaseReturn->return_type === 'stock_and_refund' && $purchaseReturn->refund_method) {
                if ($purchaseReturn->refund_method === 'cash_refund' && $purchaseReturn->refund_bank_id) {
                    // Create payment for cash refund (we receive money back via bank)
                    $purchasePayment = \App\Models\PurchasePayment::create([
                        'payment_number'   => \App\Models\PurchasePayment::generatePaymentNumber(),
                        'payment_date'     => $purchaseReturn->return_date,
                        'total_amount'     => $purchaseReturn->total_amount,
                        'bank_id'          => $purchaseReturn->refund_bank_id,
                        'payment_method'   => 'refund',
                        'reference_number' => $purchaseReturn->return_number,
                        'notes'            => "Cash Refund untuk Retur Pembelian #{$purchaseReturn->return_number}",
                        'status'           => 'confirmed',
                        'created_by'       => auth()->id(),
                        'updated_by'       => auth()->id(),
                    ]);

                    // Link payment to purchase
                    \App\Models\PurchasePaymentItem::create([
                        'purchase_payment_id' => $purchasePayment->id,
                        'purchase_id'         => $purchaseReturn->purchase_id,
                        'amount'              => $purchaseReturn->total_amount,
                    ]);

                    // Create cash movement (we're receiving money)
                    $bank = \App\Models\Bank::find($purchaseReturn->refund_bank_id);
                    if ($bank) {
                        app(\App\Services\CashMovementService::class)->createMovement(
                            $bank,
                            'PurchaseReturn',
                            $purchaseReturn->id,
                            $purchaseReturn->return_date,
                            (float) $purchaseReturn->total_amount,
                            0,
                            "Refund Retur Pembelian #{$purchaseReturn->return_number}"
                        );
                    }
                } elseif ($purchaseReturn->refund_method === 'reduce_payable') {
                    // Create payment record to reduce payable (no bank transaction)
                    // This payment record will reduce the remaining_amount automatically
                    $purchasePayment = \App\Models\PurchasePayment::create([
                        'payment_number'   => \App\Models\PurchasePayment::generatePaymentNumber(),
                        'payment_date'     => $purchaseReturn->return_date,
                        'total_amount'     => $purchaseReturn->total_amount,
                        'bank_id'          => null, // No bank transaction
                        'payment_method'   => 'refund',
                        'reference_number' => $purchaseReturn->return_number,
                        'notes'            => "Potong Hutang untuk Retur Pembelian #{$purchaseReturn->return_number}",
                        'status'           => 'confirmed',
                        'created_by'       => auth()->id(),
                        'updated_by'       => auth()->id(),
                    ]);

                    // Link payment to purchase
                    \App\Models\PurchasePaymentItem::create([
                        'purchase_payment_id' => $purchasePayment->id,
                        'purchase_id'         => $purchaseReturn->purchase_id,
                        'amount'              => $purchaseReturn->total_amount,
                    ]);
                    // Note: No bank balance change - this is just reducing the payable
                }
            }
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

            // Reverse refund if exists
            if ($purchaseReturn->return_type === 'stock_and_refund' && $purchaseReturn->refund_method) {
                // Find and delete payment created for this return
                $payment = \App\Models\PurchasePayment::where('reference_number', $purchaseReturn->return_number)
                    ->where('payment_method', 'refund')
                    ->first();

                if ($payment) {
                    // If cash_refund, delete cash movement
                    if ($purchaseReturn->refund_method === 'cash_refund' && $purchaseReturn->refund_bank_id) {
                        $cashMovement = \App\Models\CashMovement::where('reference_type', 'PurchaseReturn')
                            ->where('reference_id', $purchaseReturn->id)
                            ->first();

                        if ($cashMovement) {
                            app(\App\Services\CashMovementService::class)->deleteMovement($cashMovement);
                        }
                    }

                    // Delete payment items
                    $payment->items()->delete();
                    // Delete payment
                    $payment->delete();
                }
            }

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

            $totalCost             = 0;
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
                $restoredCost       = 0;

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
                        $avgCost       = $this->getAverageCost($detail->item_id);
                        $avgCostTotal  = $remainingQty * $avgCost;
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
                    $avgCost      = $this->getAverageCost($detail->item_id);
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
                $this->reconcileNegativeStock($detail->item_id);

                // Calculate profit adjustment (negative because we're returning)
                $profitAdjustment = $detail->subtotal - $restoredCost;

                $detail->update([
                    'cost'              => $restoredCost,
                    'profit_adjustment' => $profitAdjustment,
                ]);

                $totalCost             += $restoredCost;
                $totalProfitAdjustment += $profitAdjustment;
            }

            $saleReturn->update([
                'status'                  => 'confirmed',
                'total_cost'              => $totalCost,
                'total_profit_adjustment' => $totalProfitAdjustment,
            ]);

            // Handle refund based on refund_method
            if ($saleReturn->return_type === 'stock_and_refund' && $saleReturn->refund_method) {
                if ($saleReturn->refund_method === 'cash_refund' && $saleReturn->refund_bank_id) {
                    // Create payment for cash refund (money is returned via bank)
                    $salePayment = \App\Models\SalePayment::create([
                        'payment_number'   => \App\Models\SalePayment::generatePaymentNumber(),
                        'payment_date'     => $saleReturn->return_date,
                        'total_amount'     => $saleReturn->total_amount,
                        'bank_id'          => $saleReturn->refund_bank_id,
                        'payment_method'   => 'refund',
                        'reference_number' => $saleReturn->return_number,
                        'notes'            => "Cash Refund untuk Retur Penjualan #{$saleReturn->return_number}",
                        'status'           => 'confirmed',
                        'created_by'       => auth()->id(),
                        'updated_by'       => auth()->id(),
                    ]);

                    // Link payment to sale
                    \App\Models\SalePaymentItem::create([
                        'sale_payment_id' => $salePayment->id,
                        'sale_id'         => $saleReturn->sale_id,
                        'amount'          => $saleReturn->total_amount,
                    ]);

                    // Create cash movement (we're paying out)
                    $bank = \App\Models\Bank::find($saleReturn->refund_bank_id);
                    if ($bank) {
                        app(\App\Services\CashMovementService::class)->createMovement(
                            $bank,
                            'SaleReturn',
                            $saleReturn->id,
                            $saleReturn->return_date,
                            0,
                            (float) $saleReturn->total_amount,
                            "Refund Retur Penjualan #{$saleReturn->return_number}"
                        );
                    }
                } elseif ($saleReturn->refund_method === 'reduce_receivable') {
                    // Create payment record to reduce receivable (no bank transaction)
                    // This payment record will reduce the remaining_amount automatically
                    $salePayment = \App\Models\SalePayment::create([
                        'payment_number'   => \App\Models\SalePayment::generatePaymentNumber(),
                        'payment_date'     => $saleReturn->return_date,
                        'total_amount'     => $saleReturn->total_amount,
                        'bank_id'          => null, // No bank transaction
                        'payment_method'   => 'refund',
                        'reference_number' => $saleReturn->return_number,
                        'notes'            => "Potong Piutang untuk Retur Penjualan #{$saleReturn->return_number}",
                        'status'           => 'confirmed',
                        'created_by'       => auth()->id(),
                        'updated_by'       => auth()->id(),
                    ]);

                    // Link payment to sale
                    \App\Models\SalePaymentItem::create([
                        'sale_payment_id' => $salePayment->id,
                        'sale_id'         => $saleReturn->sale_id,
                        'amount'          => $saleReturn->total_amount,
                    ]);
                    // Note: No bank balance change - this is just reducing the receivable
                }
            }
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
                    'cost'              => 0,
                    'profit_adjustment' => 0,
                ]);
            }

            // Reverse refund if exists
            if ($saleReturn->return_type === 'stock_and_refund' && $saleReturn->refund_method === 'cash_refund' && $saleReturn->refund_bank_id) {
                // Find and delete payment created for this return
                $payment = \App\Models\SalePayment::where('reference_number', $saleReturn->return_number)
                    ->where('payment_method', 'refund')
                    ->first();

                if ($payment) {
                    // Delete cash movement (reverse the decrement)
                    $cashMovement = \App\Models\CashMovement::where('reference_type', 'SaleReturn')
                        ->where('reference_id', $saleReturn->id)
                        ->first();

                    if ($cashMovement) {
                        app(\App\Services\CashMovementService::class)->deleteMovement($cashMovement);
                    }

                    // Delete payment items
                    $payment->items()->delete();
                    // Delete payment
                    $payment->delete();
                }
            }

            $saleReturn->update([
                'status'                  => 'pending',
                'total_cost'              => 0,
                'total_profit_adjustment' => 0,
            ]);
        });
    }

    public function consumeForAdjustment(Item $item, float $quantity, array $context = []): void
    {
        if ($quantity <= 0) {
            return;
        }

        DB::transaction(function () use ($item, $quantity, $context) {
            $consumptionCost = $this->calculateFifoCost($item->id, $quantity, now());
            $unitCost        = $quantity > 0 ? $consumptionCost / $quantity : 0;

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
        });
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
            $stockMovement = null;

            if ($quantity > 0) {
                // Increase stock - add stock movement
                $stockMovement = StockMovement::create([
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
                $this->reconcileNegativeStock($item->id);
                
                // Recalculate affected sales when HPP is adjusted
                $this->recalculateAffectedSales($item->id, $unitCost, 'increase');
            } else {
                // Decrease stock - use FIFO consumption
                $absQuantity     = abs($quantity);
                $consumptionCost = $this->calculateFifoCost($item->id, $absQuantity, $adjustmentDate);
                $avgUnitCost     = $absQuantity > 0 ? $consumptionCost / $absQuantity : $unitCost;

                // Create consumption movement
                $stockMovement = StockMovement::create([
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

            // Post to journal if stock movement created and has valid cost
            if ($stockMovement && $stockMovement->unit_cost > 0) {
                try {
                    app(JournalService::class)->postStockAdjustment($stockMovement);
                } catch (\Exception $e) {
                    Log::error('Failed to post stock adjustment to journal', [
                        'stock_movement_id' => $stockMovement->id,
                        'error'             => $e->getMessage(),
                    ]);
                    // Don't throw - allow adjustment even if journal posting fails
                }
            }
        });
    }

    /**
     * Recalculate affected sales when HPP is adjusted
     */
    private function recalculateAffectedSales(int $itemId, float $newUnitCost, string $adjustmentType): void
    {
        try {
            // Get current weighted average HPP
            $currentHpp = $this->getWeightedAverageHpp($itemId);
            
            // Find all confirmed sales with this item that have FIFO mappings
            $affectedDetails = \App\Models\SaleDetail::whereHas('sale', function ($q) {
                $q->where('status', 'confirmed');
            })
            ->where('item_id', $itemId)
            ->whereHas('fifoMappings')
            ->with(['sale', 'itemUom', 'fifoMappings.stockMovement'])
            ->get();

            if ($affectedDetails->isEmpty()) {
                return;
            }

            Log::info('Recalculating affected sales after HPP adjustment', [
                'item_id' => $itemId,
                'new_unit_cost' => $newUnitCost,
                'current_weighted_hpp' => $currentHpp,
                'adjustment_type' => $adjustmentType,
                'affected_sales_count' => $affectedDetails->count(),
            ]);

            foreach ($affectedDetails as $detail) {
                $oldCost = (float) $detail->cost;
                $oldProfit = (float) $detail->profit;

                // Recalculate cost using current HPP from FIFO mappings
                $newCost = 0;
                foreach ($detail->fifoMappings as $mapping) {
                    if ($mapping->stockMovement) {
                        // Use current unit_cost from stock movement
                        $currentUnitCost = (float) $mapping->stockMovement->unit_cost;
                        $newCost += $mapping->quantity_consumed * $currentUnitCost;
                    } else {
                        // Estimated mapping
                        $newCost += (float) $mapping->total_cost;
                    }
                }

                $newProfit = (float) $detail->subtotal - $newCost;
                $costDiff = $newCost - $oldCost;
                $profitDiff = $newProfit - $oldProfit;

                // Only update if there's a significant change
                if (abs($profitDiff) > 0.01) {
                    $detail->update([
                        'cost' => $newCost,
                        'profit' => $newProfit,
                    ]);

                    $sale = $detail->sale;
                    $sale->increment('total_cost', $costDiff);
                    $sale->increment('total_profit', $profitDiff);

                    // Adjust journal entry
                    if (abs($costDiff) > 0.01) {
                        try {
                            app(JournalService::class)->adjustSaleCogs($sale, $costDiff);
                        } catch (\Exception $e) {
                            Log::error('Failed to adjust COGS journal after HPP adjustment', [
                                'sale_id' => $sale->id,
                                'sale_detail_id' => $detail->id,
                                'cost_diff' => $costDiff,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }

                    Log::info('Recalculated sale profit after HPP adjustment', [
                        'sale_id' => $sale->id,
                        'sale_number' => $sale->sale_number,
                        'detail_id' => $detail->id,
                        'item_id' => $itemId,
                        'old_cost' => $oldCost,
                        'new_cost' => $newCost,
                        'cost_diff' => $costDiff,
                        'old_profit' => $oldProfit,
                        'new_profit' => $newProfit,
                        'profit_diff' => $profitDiff,
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to recalculate affected sales after HPP adjustment', [
                'item_id' => $itemId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Don't throw - allow stock adjustment to complete even if profit recalculation fails
        }
    }

    /**
     * Get weighted average HPP for an item
     */
    private function getWeightedAverageHpp(int $itemId): float
    {
        $movements = StockMovement::where('item_id', $itemId)
            ->where('remaining_quantity', '>', 0)
            ->where('quantity', '>', 0)
            ->get();

        if ($movements->isEmpty()) {
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
     * Reconcile sales made with 0 stock (negative stock) when new stock arrives.
     * This will update FIFO mappings and adjust COGS/Profit.
     */
    public function reconcileNegativeStock(int $itemId): void
    {
        // Find all estimated mappings for this item (ordered by oldest first)
        $estimatedMappings = FifoMapping::where('reference_type', 'Sale')
            ->whereHas('saleDetail', function ($q) use ($itemId) {
                $q->where('item_id', $itemId);
            })
            ->where('is_estimated', true)
            ->orderBy('created_at', 'asc')
            ->get();

        foreach ($estimatedMappings as $mapping) {
            DB::transaction(function () use ($mapping, $itemId) {
                // Reload mapping inside transaction to be safe
                $currentMapping = FifoMapping::find($mapping->id);
                if (!$currentMapping || !$currentMapping->is_estimated) return;

                $remainingToReconcile = (float)$currentMapping->quantity_consumed;
                $originalEstimatedTotalCost = (float)$currentMapping->total_cost;
                $totalReconciledQty = 0;
                $totalNewCost = 0;

                while ($remainingToReconcile > 0) {
                    // Get the next available stock movement
                    $movement = StockMovement::where('item_id', $itemId)
                        ->where('remaining_quantity', '>', 0)
                        ->where('quantity', '>', 0)
                        ->orderBy('movement_date', 'asc')
                        ->orderBy('id', 'asc')
                        ->lockForUpdate()
                        ->first();

                    if (!$movement) break;

                    $qtyFromThisMovement = min($remainingToReconcile, (float)$movement->remaining_quantity);
                    $costFromThisMovement = $qtyFromThisMovement * (float)$movement->unit_cost;
                    
                    // Consume from movement
                    $movement->decrement('remaining_quantity', $qtyFromThisMovement);
                    
                    if ($qtyFromThisMovement >= $remainingToReconcile - 0.0001) {
                        // This movement can fully satisfy the REST of the mapping
                        $currentMapping->update([
                            'stock_movement_id' => $movement->id,
                            'is_estimated' => false,
                            'unit_cost' => (float)$movement->unit_cost,
                            'total_cost' => $remainingToReconcile * (float)$movement->unit_cost,
                        ]);
                        $totalNewCost += $costFromThisMovement;
                        $totalReconciledQty += $remainingToReconcile;
                        $remainingToReconcile = 0;
                    } else {
                        // Partial reconciliation by this movement - SPLIT MAPPING
                        // 1. Create a fully reconciled mapping for the part we just took
                        FifoMapping::create([
                            'reference_type' => $currentMapping->reference_type,
                            'reference_detail_id' => $currentMapping->reference_detail_id,
                            'stock_movement_id' => $movement->id,
                            'quantity_consumed' => $qtyFromThisMovement,
                            'unit_cost' => (float)$movement->unit_cost,
                            'total_cost' => $costFromThisMovement,
                            'is_estimated' => false,
                        ]);

                        // 2. Reduce the current mapping's quantity (it remains estimated for the rest)
                        $remainingToReconcile -= $qtyFromThisMovement;
                        $currentMapping->update([
                            'quantity_consumed' => $remainingToReconcile,
                            // Recalculate estimated total_cost proportionally
                            'total_cost' => ($remainingToReconcile / ($remainingToReconcile + $qtyFromThisMovement)) * $currentMapping->total_cost,
                        ]);

                        $totalNewCost += $costFromThisMovement;
                        $totalReconciledQty += $qtyFromThisMovement;
                    }
                }

                // If we reconciled some quantity, update the Sale Detail costs
                if ($totalReconciledQty > 0) {
                    $detail = \App\Models\SaleDetail::find($currentMapping->reference_detail_id);
                    if ($detail) {
                        // Proportion of the original estimated cost that we just reconciled
                        $propOfOriginalCost = ($totalReconciledQty / ($totalReconciledQty + $remainingToReconcile)) * $originalEstimatedTotalCost;
                        $costDifference = $totalNewCost - $propOfOriginalCost;
                        
                        // 1. Update Cost
                        $detail->increment('cost', $costDifference);
                        
                        // 2. Check profit status
                        $hasUnrealized = FifoMapping::where('reference_detail_id', $detail->id)
                            ->where('is_estimated', true)
                            ->exists();

                        $oldProfit = (float)$detail->profit;
                        $newProfit = 0;

                        if (!$hasUnrealized) {
                            $newProfit = (float)$detail->subtotal - (float)$detail->cost;
                            $detail->profit_status = 'realized';
                        } else {
                            $newProfit = 0; // Keep 0 if still partially estimated
                            $detail->profit_status = 'unrealized';
                        }
                        
                        $detail->profit = $newProfit;
                        $detail->save();

                        // 3. Update Sale Header
                        $sale = $detail->sale;
                        if ($sale) {
                            $sale->increment('total_cost', $costDifference);
                            $profitDiff = $newProfit - $oldProfit;
                            if (abs($profitDiff) > 0.01) {
                                $sale->increment('total_profit', $profitDiff);
                            }

                            // 4. Update Journal
                            if (abs($costDifference) > 0.01) {
                                try {
                                    app(\App\Services\JournalService::class)->adjustSaleCogs($sale, $costDifference);
                                } catch (\Exception $e) {
                                    Log::error('Failed to post COGS adjustment to journal during reconciliation', [
                                        'sale_id' => $sale->id,
                                        'error' => $e->getMessage(),
                                    ]);
                                }
                            }
                        }
                    }
                }
            });
        }
    }
}

