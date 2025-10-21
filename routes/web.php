<?php

use App\Http\Controllers\BankController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('dashboard');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // API routes for autocomplete
    Route::get('cities/search', [CityController::class, 'search'])->name('cities.search');

    // Purchase confirm/unconfirm routes (must be before resource)
    Route::post('purchases/{purchase}/confirm', [PurchaseController::class, 'confirm'])->name('purchases.confirm');
    Route::post('purchases/{purchase}/unconfirm', [PurchaseController::class, 'unconfirm'])->name('purchases.unconfirm');

    // Sale confirm/unconfirm routes (must be before resource)
    Route::post('sales/{sale}/confirm', [SaleController::class, 'confirm'])->name('sales.confirm');
    Route::post('sales/{sale}/unconfirm', [SaleController::class, 'unconfirm'])->name('sales.unconfirm');

    Route::resources([
        'users'       => UserController::class,
        'roles'       => RoleController::class,
        'permissions' => PermissionController::class,
        'cities'      => CityController::class,
        'customers'   => CustomerController::class,
        'suppliers'   => SupplierController::class,
        'banks'       => BankController::class,
        'items'       => ItemController::class,
        'purchases'   => PurchaseController::class,
        'sales'       => SaleController::class,
    ]);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
