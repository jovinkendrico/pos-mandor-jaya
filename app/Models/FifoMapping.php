<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FifoMapping extends Model
{
    protected $fillable = [
        'reference_type',
        'reference_detail_id',
        'stock_movement_id',
        'quantity_consumed',
        'unit_cost',
        'total_cost',
    ];

    protected $casts = [
        'quantity_consumed' => 'decimal:2',
        'unit_cost'         => 'decimal:2',
        'total_cost'        => 'decimal:2',
    ];

    public function saleDetail(): BelongsTo
    {
        return $this->belongsTo(SaleDetail::class, 'reference_detail_id')
            ->where('reference_type', 'Sale');
    }

    public function purchaseReturnDetail(): BelongsTo
    {
        return $this->belongsTo(PurchaseReturnDetail::class, 'reference_detail_id')
            ->where('reference_type', 'PurchaseReturn');
    }

    public function saleReturnDetail(): BelongsTo
    {
        return $this->belongsTo(SaleReturnDetail::class, 'reference_detail_id')
            ->where('reference_type', 'SaleReturn');
    }

    public function stockMovement(): BelongsTo
    {
        return $this->belongsTo(StockMovement::class);
    }
}

