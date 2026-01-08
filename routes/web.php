<?php

use App\Http\Controllers\BankController;
use App\Http\Controllers\ChartOfAccountController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\PurchasePaymentController;
use App\Http\Controllers\PurchaseReturnController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SalePaymentController;
use App\Http\Controllers\SaleReturnController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UomController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CashInController;
use App\Http\Controllers\CashOutController;
use App\Http\Controllers\JournalEntryController;
use App\Http\Controllers\ProfitLossController;
use App\Http\Controllers\GeneralLedgerController;
use App\Http\Controllers\SaleReportController;
use App\Http\Controllers\PurchaseReportController;
use App\Http\Controllers\ReceivableAgingController;
use App\Http\Controllers\PayableAgingController;
use App\Http\Controllers\InventoryValuationController;
use App\Http\Controllers\CashFlowController;
use App\Http\Controllers\SaleByCustomerReportController;
use App\Http\Controllers\SaleByItemReportController;
use App\Http\Controllers\PurchaseBySupplierReportController;
use App\Http\Controllers\StockMinMaxReportController;
use App\Http\Controllers\BalanceSheetController;
use App\Http\Controllers\SaleReturnReportController;
use App\Http\Controllers\PurchaseReturnReportController;
use App\Http\Controllers\SalePaymentReportController;
use App\Http\Controllers\PurchasePaymentReportController;
use App\Http\Controllers\CashInOutReportController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\BestSellerReportController;
use App\Http\Controllers\DeadStockReportController;
use App\Http\Controllers\StockTurnoverReportController;
use App\Http\Controllers\MarginByItemReportController;
use App\Http\Controllers\MarginByCustomerReportController;
use App\Http\Controllers\PaymentReceiptController;
use App\Http\Controllers\ImportItemController;
use App\Http\Controllers\ImportCustomerController;
use App\Http\Controllers\ImportSupplierController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('home');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // API routes for autocomplete
    Route::get('/cities/search', [CityController::class, 'search'])->name('cities.search');
    Route::get('/stock-adjustments/items/search', [StockAdjustmentController::class, 'searchItems'])->name('stock-adjustments.items.search');

    Route::post('cities/store', [CityController::class, 'storeCity'])->name('cities.storeCity');

    // Autocomplete API
    Route::get('/customers/search', [CustomerController::class, 'search'])->name('customers.search');
    Route::get('/suppliers/search', [SupplierController::class, 'search'])->name('suppliers.search');

    // Purchase confirm/unconfirm routes (must be before resource)
    Route::post('purchases/{purchase}/confirm', [PurchaseController::class, 'confirm'])->name('purchases.confirm');
    Route::post('purchases/{purchase}/unconfirm', [PurchaseController::class, 'unconfirm'])->name('purchases.unconfirm');
    Route::get('purchases/{purchase}/print', [PurchaseController::class, 'print'])->name('purchases.print');

    // Sale confirm/unconfirm routes (must be before resource)
    Route::post('sales/{sale}/confirm', [SaleController::class, 'confirm'])->name('sales.confirm');
    Route::post('sales/{sale}/unconfirm', [SaleController::class, 'unconfirm'])->name('sales.unconfirm');
    Route::get('sales/{sale}/print', [SaleController::class, 'print'])->name('sales.print');

    // Purchase Return confirm/unconfirm routes (must be before resource)
    Route::post('purchase-returns/{purchase_return}/confirm', [PurchaseReturnController::class, 'confirm'])->name('purchase-returns.confirm');
    Route::post('purchase-returns/{purchase_return}/unconfirm', [PurchaseReturnController::class, 'unconfirm'])->name('purchase-returns.unconfirm');

    // Sale Return confirm/unconfirm routes (must be before resource)
    Route::post('sale-returns/{sale_return}/confirm', [SaleReturnController::class, 'confirm'])->name('sale-returns.confirm');
    Route::post('sale-returns/{sale_return}/unconfirm', [SaleReturnController::class, 'unconfirm'])->name('sale-returns.unconfirm');

    // Purchase Payment confirm/unconfirm routes (must be before resource)
    Route::get('purchase-payments/search-purchases', [PurchasePaymentController::class, 'searchPurchases'])->name('purchase-payments.search-purchases');
    Route::post('purchase-payments/{purchase_payment}/confirm', [PurchasePaymentController::class, 'confirm'])->name('purchase-payments.confirm');
    Route::post('purchase-payments/{purchase_payment}/unconfirm', [PurchasePaymentController::class, 'unconfirm'])->name('purchase-payments.unconfirm');

    // Sale Payment confirm/unconfirm routes (must be before resource)
    Route::get('sale-payments/search-sales', [SalePaymentController::class, 'searchSales'])->name('sale-payments.search-sales');
    Route::post('sale-payments/{sale_payment}/confirm', [SalePaymentController::class, 'confirm'])->name('sale-payments.confirm');
    Route::post('sale-payments/{sale_payment}/unconfirm', [SalePaymentController::class, 'unconfirm'])->name('sale-payments.unconfirm');

    // Cash In post/reverse routes (must be before resource)
    Route::post('cash-ins/{cash_in}/post', [CashInController::class, 'post'])->name('cash-ins.post');
    Route::post('cash-ins/{cash_in}/reverse', [CashInController::class, 'reverse'])->name('cash-ins.reverse');

    // Cash Out post/reverse routes (must be before resource)
    Route::post('cash-outs/{cash_out}/post', [CashOutController::class, 'post'])->name('cash-outs.post');
    Route::post('cash-outs/{cash_out}/reverse', [CashOutController::class, 'reverse'])->name('cash-outs.reverse');

    // Accounting Reports
    Route::get('profit-loss', [ProfitLossController::class, 'index'])->name('profit-loss.index');
    Route::get('general-ledger', [GeneralLedgerController::class, 'index'])->name('general-ledger.index');
    Route::get('general-ledger/{account}', [GeneralLedgerController::class, 'show'])->name('general-ledger.show');

    // Business Reports
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/sale-report', [SaleReportController::class, 'index'])->name('reports.sale-report');
    Route::get('reports/purchase-report', [PurchaseReportController::class, 'index'])->name('reports.purchase-report');
    Route::get('reports/receivable-aging', [ReceivableAgingController::class, 'index'])->name('reports.receivable-aging');
    Route::get('reports/payable-aging', [PayableAgingController::class, 'index'])->name('reports.payable-aging');
    Route::get('reports/inventory-valuation', [InventoryValuationController::class, 'index'])->name('reports.inventory-valuation');
    Route::get('reports/cash-flow', [CashFlowController::class, 'index'])->name('reports.cash-flow');
    Route::get('reports/sale-by-customer', [SaleByCustomerReportController::class, 'index'])->name('reports.sale-by-customer');
    Route::get('reports/sale-by-item', [SaleByItemReportController::class, 'index'])->name('reports.sale-by-item');
    Route::get('reports/purchase-by-supplier', [PurchaseBySupplierReportController::class, 'index'])->name('reports.purchase-by-supplier');
    Route::get('reports/stock-min-max', [StockMinMaxReportController::class, 'index'])->name('reports.stock-min-max');
    Route::get('reports/balance-sheet', [BalanceSheetController::class, 'index'])->name('reports.balance-sheet');
    Route::get('reports/sale-return', [SaleReturnReportController::class, 'index'])->name('reports.sale-return');
    Route::get('reports/purchase-return', [PurchaseReturnReportController::class, 'index'])->name('reports.purchase-return');
    Route::get('reports/sale-payment', [SalePaymentReportController::class, 'index'])->name('reports.sale-payment');
    Route::get('reports/purchase-payment', [PurchasePaymentReportController::class, 'index'])->name('reports.purchase-payment');
    Route::get('reports/cash-in-out', [CashInOutReportController::class, 'index'])->name('reports.cash-in-out');
    Route::get('reports/best-seller', [BestSellerReportController::class, 'index'])->name('reports.best-seller');
    Route::get('reports/dead-stock', [DeadStockReportController::class, 'index'])->name('reports.dead-stock');
    Route::get('reports/stock-turnover', [StockTurnoverReportController::class, 'index'])->name('reports.stock-turnover');
    Route::get('reports/margin-by-item', [MarginByItemReportController::class, 'index'])->name('reports.margin-by-item');
    Route::get('reports/margin-by-customer', [MarginByCustomerReportController::class, 'index'])->name('reports.margin-by-customer');
    Route::get('reports/binder', [\App\Http\Controllers\BinderReportController::class, 'index'])->name('reports.binder');

    // Print routes for all reports
    Route::get('reports/sale-report/print', [SaleReportController::class, 'print'])->name('reports.sale-report.print');
    Route::get('reports/purchase-report/print', [PurchaseReportController::class, 'print'])->name('reports.purchase-report.print');
    Route::get('reports/inventory-valuation/print', [InventoryValuationController::class, 'print'])->name('reports.inventory-valuation.print');
    Route::get('reports/sale-by-customer/print', [SaleByCustomerReportController::class, 'print'])->name('reports.sale-by-customer.print');
    Route::get('reports/sale-by-item/print', [SaleByItemReportController::class, 'print'])->name('reports.sale-by-item.print');
    Route::get('reports/purchase-by-supplier/print', [PurchaseBySupplierReportController::class, 'print'])->name('reports.purchase-by-supplier.print');
    Route::get('reports/stock-min-max/print', [StockMinMaxReportController::class, 'print'])->name('reports.stock-min-max.print');
    Route::get('reports/balance-sheet/print', [BalanceSheetController::class, 'print'])->name('reports.balance-sheet.print');
    Route::get('reports/sale-return/print', [SaleReturnReportController::class, 'print'])->name('reports.sale-return.print');
    Route::get('reports/purchase-return/print', [PurchaseReturnReportController::class, 'print'])->name('reports.purchase-return.print');
    Route::get('reports/sale-payment/print', [SalePaymentReportController::class, 'print'])->name('reports.sale-payment.print');
    Route::get('reports/purchase-payment/print', [PurchasePaymentReportController::class, 'print'])->name('reports.purchase-payment.print');
    Route::get('reports/cash-in-out/print', [CashInOutReportController::class, 'print'])->name('reports.cash-in-out.print');
    Route::get('reports/best-seller/print', [BestSellerReportController::class, 'print'])->name('reports.best-seller.print');
    Route::get('reports/dead-stock/print', [DeadStockReportController::class, 'print'])->name('reports.dead-stock.print');
    Route::get('reports/stock-turnover/print', [StockTurnoverReportController::class, 'print'])->name('reports.stock-turnover.print');
    Route::get('reports/margin-by-item/print', [MarginByItemReportController::class, 'print'])->name('reports.margin-by-item.print');
    Route::get('reports/margin-by-customer/print', [MarginByCustomerReportController::class, 'print'])->name('reports.margin-by-customer.print');
    Route::get('reports/receivable-aging/print', [ReceivableAgingController::class, 'print'])->name('reports.receivable-aging.print');
    Route::get('reports/payable-aging/print', [PayableAgingController::class, 'print'])->name('reports.payable-aging.print');
    Route::get('reports/cash-flow/print', [CashFlowController::class, 'print'])->name('reports.cash-flow.print');
    Route::get('reports/binder/print', [\App\Http\Controllers\BinderReportController::class, 'print'])->name('reports.binder.print');

    // Payment Receipt
    Route::get('payment-receipt', [PaymentReceiptController::class, 'index'])->name('payment-receipt.index');
    Route::get('payment-receipt/print', [PaymentReceiptController::class, 'print'])->name('payment-receipt.print');

    // Bank Cash Movement
    Route::get('banks/{bank}/cash-movement', [BankController::class, 'cashMovement'])->name('banks.cash-movement');

    // Item Stock Card
    Route::get('items/{item}/stock-card', [ItemController::class, 'stockCard'])->name('items.stock-card');

    // Import routes
    Route::get('items/import', [ImportItemController::class, 'create'])->name('items.import');
    Route::post('items/import', [ImportItemController::class, 'store'])->name('items.import.store');
    Route::get('items/import/template', [ImportItemController::class, 'downloadTemplate'])->name('items.import.template');
    Route::get('customers/import', [ImportCustomerController::class, 'create'])->name('customers.import');
    Route::post('customers/import', [ImportCustomerController::class, 'store'])->name('customers.import.store');
    Route::get('customers/import/template', [ImportCustomerController::class, 'downloadTemplate'])->name('customers.import.template');
    Route::get('suppliers/import', [ImportSupplierController::class, 'create'])->name('suppliers.import');
    Route::post('suppliers/import', [ImportSupplierController::class, 'store'])->name('suppliers.import.store');
    Route::get('suppliers/import/template', [ImportSupplierController::class, 'downloadTemplate'])->name('suppliers.import.template');

    // Debug Orphans
    Route::get('/debug/orphans', function () {
        $movements = \App\Models\StockMovement::where('reference_type', 'Sale')->get();
        $orphans = [];

        foreach ($movements as $movement) {
            // Check if sale exists
            $sale = \App\Models\Sale::find($movement->reference_id);
            if (!$sale) {
                // Orphan because Sale header is gone (very bad)
                $orphans[] = [
                    'type' => 'Missing Sale Header',
                    'movement_id' => $movement->id,
                    'reference_id' => $movement->reference_id,
                    'item_id' => $movement->item_id,
                    'item_name' => $movement->item->name ?? 'Unknown Item',
                    'quantity' => $movement->quantity,
                    'date' => $movement->movement_date,
                    'notes' => $movement->notes
                ];
                continue;
            }

            // Check if detail exists
            $detail = $sale->details()->where('item_id', $movement->item_id)->first();
            if (!$detail) {
                // Orphan because Sale Detail is gone
                $orphans[] = [
                    'type' => 'Missing Sale Detail',
                    'movement_id' => $movement->id,
                    'reference_id' => $movement->reference_id,
                    'sale_number' => $sale->sale_number,
                    'item_id' => $movement->item_id,
                    'item_name' => $movement->item->name ?? 'Unknown Item',
                    'quantity' => $movement->quantity, // Negative for sales
                    'date' => $movement->movement_date,
                    'notes' => $movement->notes
                ];
            }
        }

        return response()->json([
            'count' => count($orphans),
            'orphans' => $orphans
        ]);
    });

    // Identify Reconstructed/Missing Items AND Empty Sales
    Route::get('/debug/identify-reconstructed', function () {
        $sales = [];

        // 1. Find details created significantly later than the sale header (> 1 hour)
        $details = \App\Models\SaleDetail::with(['sale', 'item'])
            ->whereHas('sale')
            ->get() 
            ->filter(function ($detail) {
                if (!$detail->sale || !$detail->created_at || !$detail->sale->created_at) return false;
                $diff = $detail->sale->created_at->diffInMinutes($detail->created_at);
                return $diff > 60;
            });

        foreach ($details as $detail) {
            $saleId = $detail->sale_id;
            if (!isset($sales[$saleId])) {
                $sales[$saleId] = [
                    'type' => 'RECONSTRUCTED_ITEMS',
                    'sale_id' => $saleId,
                    'sale_number' => $detail->sale->sale_number,
                    'sale_date' => $detail->sale->sale_date->format('Y-m-d'),
                    'detail_created_at' => $detail->created_at->format('Y-m-d H:i:s'),
                    'items' => []
                ];
            }
            
            $sales[$saleId]['items'][] = [
                'item_name' => $detail->item->name ?? 'Unknown',
                'quantity' => $detail->quantity + 0,
                'price' => $detail->price + 0,
                'subtotal' => $detail->subtotal + 0
            ];
        }

        // 2. Find Sales with NO details at all
        $emptySales = \App\Models\Sale::doesntHave('details')->get();
        foreach ($emptySales as $emptySale) {
            $sales['empty_' . $emptySale->id] = [
                'type' => 'EMPTY_SALE_NO_ITEMS',
                'sale_id' => $emptySale->id,
                'sale_number' => $emptySale->sale_number,
                'sale_date' => $emptySale->sale_date->format('Y-m-d'),
                'detail_created_at' => '-',
                'items' => []
            ];
        }

        // Sort by Sale Number
        usort($sales, function($a, $b) {
            return strcmp($a['sale_number'], $b['sale_number']);
        });

        return response()->json([
            'count' => count($sales),
            'note' => 'List includes sales with reconstructed items AND sales with absolutely no items.',
            'sales' => array_values($sales)
        ]);
    });

    // Dedicated Empty Sales Check
    Route::get('/debug/empty-sales', function () {
        $emptySales = \App\Models\Sale::doesntHave('details')->with('customer')->get();
        
        $results = [];
        foreach ($emptySales as $sale) {
            $results[] = [
                'sale_id' => $sale->id,
                'sale_number' => $sale->sale_number,
                'status' => $sale->status,
                'date' => $sale->sale_date->format('Y-m-d'),
                'customer' => $sale->customer->name ?? 'Unknown',
                'total_amount' => number_format($sale->total_amount, 2),
                'created_at' => $sale->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $sale->updated_at->format('Y-m-d H:i:s'),
            ];
        }

        return response()->json([
            'count' => count($results),
            'description' => 'List of Sales IDs that exist in database but have ZERO rows in sale_details table.',
            'sales' => $results
        ]);
    });

    // Validasi Total Header vs Detail
    Route::get('/debug/mismatch-totals', function () {
        $sales = \App\Models\Sale::with('details')->get();
        $mismatches = [];

        foreach ($sales as $sale) {
            // 1. Cek Subtotal (Header vs Sum Detail)
            $detailSubtotal = $sale->details->sum('subtotal');
            $headerSubtotal = $sale->subtotal;

            if (abs($detailSubtotal - $headerSubtotal) > 50) { // Toleransi 50 perak (pembulatan)
                $mismatches[] = [
                    'sale_number' => $sale->sale_number,
                    'issue' => 'Subtotal Mismatch',
                    'header_subtotal' => $headerSubtotal,
                    'detail_sum' => $detailSubtotal,
                    'diff' => $headerSubtotal - $detailSubtotal
                ];
                continue;
            }

            // 2. Cek Rumus Grand Total
            // Subtotal - Disc + PPN = Total
            $calcAfterDisc = $sale->subtotal - $sale->discount1_amount - $sale->discount2_amount;
            $calcPpn = $sale->ppn_amount;
            $calcTotal = $calcAfterDisc + $calcPpn;
            
            if (abs($sale->total_amount - $calcTotal) > 50) {
                 $mismatches[] = [
                    'sale_number' => $sale->sale_number,
                    'issue' => 'Grand Total Calculation Error',
                    'header_total' => $sale->total_amount,
                    'calculated_total' => $calcTotal,
                    'diff' => $sale->total_amount - $calcTotal
                ];
            }
        }

        return response()->json([
            'count' => count($mismatches),
            'note' => 'Sales where Header Money does not match Item Details Sum',
            'mismatches' => $mismatches
        ]);
    });

    // Validasi Purchase Total Header vs Detail
    Route::get('/debug/purchase-mismatch-totals', function () {
        $purchases = \App\Models\Purchase::with('details')->get();
        $mismatches = [];

        foreach ($purchases as $purchase) {
            // 1. Cek Gross Sum (Header Subtotal vs Sum(Qty * Price))
            $detailGross = $purchase->details->reduce(function ($carry, $detail) {
                return $carry + ($detail->quantity * $detail->price);
            }, 0);
            $headerGross = $purchase->subtotal;

            if (abs($detailGross - $headerGross) > 50) {
                $mismatches[] = [
                    'purchase_number' => $purchase->purchase_number,
                    'issue' => 'Gross Subtotal Mismatch',
                    'header_subtotal' => $headerGross,
                    'detail_gross_sum' => $detailGross,
                    'diff' => $headerGross - $detailGross
                ];
                continue;
            }

            // 2. Cek Net Sum (Header Total After Discount vs Sum(Detail Subtotal))
            // Detail Subtotal = Net Amount per line
            $detailNet = $purchase->details->sum('subtotal');
            $headerNet = $purchase->total_after_discount;

            if (abs($detailNet - $headerNet) > 50) {
                 $mismatches[] = [
                    'purchase_number' => $purchase->purchase_number,
                    'issue' => 'Net Amount Mismatch',
                    'header_net' => $headerNet,
                    'detail_net_sum' => $detailNet,
                    'diff' => $headerNet - $detailNet
                ];
                continue;
            }

            // 3. Cek Grand Total (Header Total Amount vs Header Net + PPN)
            $calcTotal = $headerNet + $purchase->ppn_amount;
            
            if (abs($purchase->total_amount - $calcTotal) > 50) {
                 $mismatches[] = [
                    'purchase_number' => $purchase->purchase_number,
                    'issue' => 'Grand Total Calculation Error',
                    'header_total' => $purchase->total_amount,
                    'calculated_total' => $calcTotal,
                    'diff' => $purchase->total_amount - $calcTotal
                ];
            }
        }

        return response()->json([
            'count' => count($mismatches),
            'description' => 'Mismatches in Purchase Totals (Gross, Net, or Grand Total)',
            'mismatches' => $mismatches
        ]);
    });

    // Reset & Reproly All Transactions (Reset History)
    Route::get('/debug/reprocess-all', function () {
        set_time_limit(0); 
        // Increase memory limit for heavy processing
        ini_set('memory_limit', '512M');

        $log = [];
        $log[] = "Starting Reprocess...";

        // 1. Unconfirm ALL Confirmed Purchases (Reverse Order to be safe, though not strictly needed)
        $confirmedPurchases = \App\Models\Purchase::where('status', 'confirmed')->orderByDesc('id')->get();
        foreach ($confirmedPurchases as $purchase) {
            try {
                app(\App\Services\StockService::class)->unconfirmPurchase($purchase);
            } catch (\Exception $e) {
                // Ignore errors, continue
            }
        }
        $log[] = "Unconfirmed " . $confirmedPurchases->count() . " Purchases.";

        // 2. Unconfirm ALL Confirmed Sales
        $confirmedSales = \App\Models\Sale::where('status', 'confirmed')->orderByDesc('id')->get();
        foreach ($confirmedSales as $sale) {
            try {
                app(\App\Services\StockService::class)->unconfirmSale($sale);
            } catch (\Exception $e) {
                // Ignore errors
            }
        }
        $log[] = "Unconfirmed " . $confirmedSales->count() . " Sales.";

        // Optional: Clean up any orphaned stock movements just in case
        // Optional: Clean up orphaned data specific to Sales/Purchases ONLY
        // DO NOT Truncate tables to preserve Stock Adjustments and Manual Entries
        
        // 1. Clean up StockMovements for Sales/Purchases/Returns
        \App\Models\StockMovement::whereIn('reference_type', ['Sale', 'Purchase', 'SaleReturn', 'PurchaseReturn'])->delete();
        
        // 2. Clean up FIFO Mappings (Specific to Sales/Returns)
        \App\Models\FifoMapping::truncate(); // Safe as Adjustments don't use this table yet
        
        // 3. Clean up Journals for Sales/Purchases/Returns (Keep Adjustments/Manual Journals)
        \App\Models\JournalEntry::whereIn('reference_type', ['Sale', 'Purchase', 'SaleReturn', 'PurchaseReturn', 'SaleAdjustment'])->delete();
        // Also cleanup details for deleted journals? cascadeDelete usually handles it, but to be sure:
        // JournalEntry cleanup handled by cascade if configured, but let's assume standard Laravel Model delete logic won't cascade SQL-wise without migration setup. 
        // Better: delete details where journal_entry_id not in (select id from journal_entries)
        \App\Models\JournalEntryDetail::whereDoesntHave('journalEntry')->delete();

        // 4. Clean up Payments/CashMovements generated by Sales/Purchases?
        // If we want to preserve payment history, we should be careful. 
        // But if headers are re-confirmed, logic might re-trigger payments? 
        // No, confirmSale/Purchase usually doesn't create payments unless it's a Cash Return.
        // Standard Credit Sale/Purchase doesn't create payment on confirm.
        // So we leave Payments alone.

        // 5. CRITICAL: Recalculate Item Stock based on REMAINING movements (Adjustments + Opening)
        // This ensures we start with [Initial + Adjustments] before re-playing Sales/Purchases
        $items = \App\Models\Item::all();
        foreach ($items as $item) {
            $currentStock = \App\Models\StockMovement::where('item_id', $item->id)->sum('quantity');
            $item->update(['stock' => $currentStock]);
        }
        
        $log[] = "Cleaned Sales/Purchase data. Reset Stock to (Opening + Adjustments).";

        // 3. Confirm ALL Sales (Chronological)
        // Strat: Process Sales first so they grab "Estimated Cost".
        // Then Purchases will arrive and "Reconcile" them.
        $allSales = \App\Models\Sale::orderBy('sale_date')->orderBy('id')->get();
        $salesCount = 0;
        foreach ($allSales as $sale) {
            try {
                // Recalculate Totals first (Fix inconsistencies)
                 // Manually sum details
                 $subtotal = $sale->details->sum('subtotal');
                 $discount1 = $sale->discount1_amount; // Keep existing discount amounts or recalc? 
                 // Better safely just Confirm. The mismatched totals script can fix header later if needed.
                 // Actually StockService calculates cost. It doesn't fix "Total Amount" on header.
                 // But that's fine.
                app(\App\Services\StockService::class)->confirmSale($sale);
                $salesCount++;
            } catch (\Exception $e) {
                $log[] = "Error Confirming Sale #{$sale->sale_number}: " . $e->getMessage();
            }
        }
        $log[] = "Re-Confirmed $salesCount Sales.";

        // 4. Confirm ALL Purchases (Chronological)
        // This will trigger 'reconcileNegativeStock' and fix the Sales costs.
        $allPurchases = \App\Models\Purchase::orderBy('purchase_date')->orderBy('id')->get();
        $purchCount = 0;
        foreach ($allPurchases as $purchase) {
            try {
                app(\App\Services\StockService::class)->confirmPurchase($purchase);
                $purchCount++;
            } catch (\Exception $e) {
                $log[] = "Error Confirming Purchase #{$purchase->purchase_number}: " . $e->getMessage();
            }
        }
        $log[] = "Re-Confirmed $purchCount Purchases.";

        $log[] = "Done.";
        return response()->json($log);
    });

    // Check for duplicate UOM conversions (e.g. 1 PCS and 1 KG both having conversion 1)
    Route::get('/debug/check-duplicate-conversion', function () {
        $items = \App\Models\Item::with(['itemUoms.uom'])->get();
        $duplicates = [];

        foreach ($items as $item) {
            $conversionGroups = $item->itemUoms->groupBy(function ($itemUom) {
                // Cast to float string to avoid precision issues
                return (string)(float)$itemUom->conversion_value;
            });

            foreach ($conversionGroups as $value => $uoms) {
                if ($uoms->count() > 1) {
                    $uomNames = $uoms->map(fn($iu) => optional($iu->uom)->name ?? 'Unknown')->join(', ');
                    $duplicates[] = [
                        'item_id' => $item->id,
                        'item_name' => $item->name,
                        'conversion_value' => $value,
                        'conflicting_uoms' => $uomNames
                    ];
                }
            }
        }

        return response()->json([
            'message' => 'Found ' . count($duplicates) . ' items with duplicate UOM conversion values.',
            'data' => $duplicates
        ]);
    });
    
    // Check for Negative Profit
    Route::get('/debug/negative-profit', function () {
        // 1. Check Detail Profit < 0 (Only Confirmed Sales)
        $negativeDetails = \App\Models\SaleDetail::with(['sale', 'item'])
            ->whereHas('sale', function ($q) {
                $q->where('status', 'confirmed');
            })
            ->where('profit', '<', 0)
            ->get()
            ->map(function ($detail) {
                return [
                    'type' => 'Detail Negative Profit',
                    'sale_id' => $detail->sale_id,
                    'sale_number' => $detail->sale->sale_number ?? 'Unknown',
                    'item_name' => $detail->item->name ?? 'Unknown',
                    'quantity' => (float) $detail->quantity,
                    'price' => (float) $detail->price,
                    'cost' => (float) $detail->cost,
                    'profit' => (float) $detail->profit,
                    'created_at' => $detail->created_at->format('Y-m-d H:i:s'),
                ];
            });

        // 2. Check Header Total Profit < 0 (Only Confirmed Sales)
        $negativeHeaders = \App\Models\Sale::with('customer')
            ->where('status', 'confirmed')
            ->where('total_profit', '<', 0)
            ->get()
            ->map(function ($sale) {
                return [
                    'type' => 'Header Negative Profit',
                    'sale_id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'customer' => $sale->customer->name ?? 'Unknown',
                    'total_amount' => (float) $sale->total_amount,
                    'total_cost' => (float) $sale->total_cost,
                    'total_profit' => (float) $sale->total_profit,
                    'date' => $sale->sale_date->format('Y-m-d'),
                ];
            });

        return response()->json([
            'negative_details_count' => $negativeDetails->count(),
            'negative_headers_count' => $negativeHeaders->count(),
            'negative_details' => $negativeDetails,
            'negative_headers' => $negativeHeaders,
        ]);
    });

    Route::resources([
        'users'             => UserController::class,
        'roles'             => RoleController::class,
        'permissions'       => PermissionController::class,
        'cities'            => CityController::class,
        'customers'         => CustomerController::class,
        'suppliers'         => SupplierController::class,
        'banks'             => BankController::class,
        'chart-of-accounts' => ChartOfAccountController::class,
        'uoms'              => UomController::class,
        'items'             => ItemController::class,
        'purchases'         => PurchaseController::class,
        'sales'             => SaleController::class,
        'purchase-returns'  => PurchaseReturnController::class,
        'sale-returns'      => SaleReturnController::class,
        'purchase-payments' => PurchasePaymentController::class,
        'sale-payments'     => SalePaymentController::class,
        'stock-adjustments' => StockAdjustmentController::class,
        'cash-ins'          => CashInController::class,
        'cash-outs'          => CashOutController::class,
        'journal-entries'   => JournalEntryController::class,
    ]);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
