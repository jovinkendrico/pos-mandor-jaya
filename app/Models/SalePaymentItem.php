<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalePaymentItem extends Model
{
    protected $fillable = [
        'sale_payment_id',
        'sale_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    /**
     * Get the sale payment this item belongs to.
     */
    public function salePayment(): BelongsTo
    {
        return $this->belongsTo(SalePayment::class);
    }

    /**
     * Get the sale this item is for.
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}
