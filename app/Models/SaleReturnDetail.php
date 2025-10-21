<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SaleReturnDetail extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sale_return_id',
        'sale_detail_id',
        'item_id',
        'item_uom_id',
        'quantity',
        'price',
        'discount1_percent',
        'discount1_amount',
        'discount2_percent',
        'discount2_amount',
        'subtotal',
        'cost',
        'profit_adjustment',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'price' => 'decimal:2',
        'discount1_percent' => 'decimal:2',
        'discount1_amount' => 'decimal:2',
        'discount2_percent' => 'decimal:2',
        'discount2_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'cost' => 'decimal:2',
        'profit_adjustment' => 'decimal:2',
    ];

    public function saleReturn(): BelongsTo
    {
        return $this->belongsTo(SaleReturn::class);
    }

    public function saleDetail(): BelongsTo
    {
        return $this->belongsTo(SaleDetail::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function itemUom(): BelongsTo
    {
        return $this->belongsTo(ItemUom::class);
    }
}
