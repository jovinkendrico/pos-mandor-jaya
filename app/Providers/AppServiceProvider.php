<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Database\Eloquent\Relations\Relation::morphMap([
            'Bank' => \App\Models\Bank::class,
            'CashIn' => \App\Models\CashIn::class,
            'CashOut' => \App\Models\CashOut::class,
            'Item' => \App\Models\Item::class,
            'MemberLoan' => \App\Models\MemberLoan::class,
            'OverpaymentTransaction' => \App\Models\OverpaymentTransaction::class,
            'Purchase' => \App\Models\Purchase::class,
            'PurchasePayment' => \App\Models\PurchasePayment::class,
            'PurchaseReturn' => \App\Models\PurchaseReturn::class,
            'Sale' => \App\Models\Sale::class,
            'SalePayment' => \App\Models\SalePayment::class,
            'SaleReturn' => \App\Models\SaleReturn::class,
            'StockAdjustment' => \App\Models\StockMovement::class,
            'Adjustment' => \App\Models\StockMovement::class,
            'OpeningBalance' => \App\Models\ChartOfAccount::class,
        ]);
    }
}
