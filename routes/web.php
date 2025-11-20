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
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('home');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // API routes for autocomplete
    Route::get('/cities/search', [CityController::class, 'search'])->name('cities.search');

    Route::post('cities/store', [CityController::class, 'storeCity'])->name('cities.storeCity');

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
    Route::post('purchase-payments/{purchase_payment}/confirm', [PurchasePaymentController::class, 'confirm'])->name('purchase-payments.confirm');
    Route::post('purchase-payments/{purchase_payment}/unconfirm', [PurchasePaymentController::class, 'unconfirm'])->name('purchase-payments.unconfirm');

    // Sale Payment confirm/unconfirm routes (must be before resource)
    Route::post('sale-payments/{sale_payment}/confirm', [SalePaymentController::class, 'confirm'])->name('sale-payments.confirm');
    Route::post('sale-payments/{sale_payment}/unconfirm', [SalePaymentController::class, 'unconfirm'])->name('sale-payments.unconfirm');

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
    ]);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
