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
            'MemberLoan' => \App\Models\MemberLoan::class,
            'PurchasePayment' => \App\Models\PurchasePayment::class,
            'Sale' => \App\Models\Sale::class,
            'SalePayment' => \App\Models\SalePayment::class,
            'StockAdjustment' => \App\Models\StockMovement::class,
            'Adjustment' => \App\Models\StockMovement::class,
        ]);
    }
}
