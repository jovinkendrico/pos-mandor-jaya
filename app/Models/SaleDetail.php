<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleDetail extends Model
{
    protected $fillable = [
        'sale_id',
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
        'profit',
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
        'profit' => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function itemUom(): BelongsTo
    {
        return $this->belongsTo(ItemUom::class);
    }

    public function fifoMappings(): HasMany
    {
        return $this->hasMany(FifoMapping::class, 'reference_detail_id')
            ->where('reference_type', 'Sale');
    }
}
