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
