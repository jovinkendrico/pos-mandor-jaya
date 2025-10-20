<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'base_uom',
        'stock',
        'description',
    ];

    protected $casts = [
        'stock' => 'decimal:2',
    ];

    public function uoms(): HasMany
    {
        return $this->hasMany(ItemUom::class);
    }

    public function baseUom()
    {
        return $this->uoms()->where('is_base', true)->first();
    }
}
