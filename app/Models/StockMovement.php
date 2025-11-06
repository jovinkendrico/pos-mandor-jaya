<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    protected $fillable = [
        'item_id',
        'unit_cost',
        'remaining_quantity',
        'movement_date',
        'notes',
    ];

    protected $casts = [
        'movement_date'      => 'date',
        'unit_cost'          => 'decimal:2',
        'remaining_quantity' => 'decimal:2',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
