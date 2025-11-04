<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ItemUom extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'item_id',
        'uom_id',
        'conversion_value',
        'price',
        'is_base',
    ];

    protected $casts = [
        'conversion_value' => 'integer',
        'price'            => 'decimal:2',
        'is_base'          => 'boolean',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function uom(): BelongsTo
    {
        return $this->belongsTo(Uom::class);
    }
}
