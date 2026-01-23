<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Auditable;

class Item extends Model
{
    use SoftDeletes, Auditable;


    protected $fillable = [
        'code',
        'name',
        'stock',
        'initial_stock',
        'description',
    ];

    protected $casts = [
        'stock'         => 'decimal:2',
        'initial_stock' => 'decimal:2',
    ];

    public function itemUoms(): HasMany
    {
        return $this->hasMany(ItemUom::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function baseUom()
    {
        return $this->itemUoms()->where('is_base', true)->first();
    }

    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('code', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        });
    }
}
