<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sale_number',
        'customer_id',
        'sale_date',
        'due_date',
        'subtotal',
        'discount1_percent',
        'discount1_amount',
        'discount2_percent',
        'discount2_amount',
        'total_after_discount',
        'ppn_percent',
        'ppn_amount',
        'total_amount',
        'total_cost',
        'total_profit',
        'status',
        'notes',
    ];

    protected $casts = [
        'sale_date'            => 'date',
        'due_date'             => 'date',
        'subtotal'             => 'decimal:2',
        'discount1_percent'    => 'decimal:2',
        'discount1_amount'     => 'decimal:2',
        'discount2_percent'    => 'decimal:2',
        'discount2_amount'     => 'decimal:2',
        'total_after_discount' => 'decimal:2',
        'ppn_percent'          => 'decimal:2',
        'ppn_amount'           => 'decimal:2',
        'total_amount'         => 'decimal:2',
        'total_cost'           => 'decimal:2',
        'total_profit'         => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(SaleDetail::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'reference_id')
            ->where('reference_type', 'Sale');
    }

    /**
     * Generate unique sale number
     */
    public static function generateSaleNumber($saleDate = null): string
    {
        $date = $saleDate ? date('Ymd', strtotime($saleDate)) : now()->format('Ymd');

        // Use lockForUpdate to prevent race conditions in concurrent requests
        $lastSale = static::whereDate('sale_date', $saleDate ? date('Y-m-d', strtotime($saleDate)) : today())
            ->lockForUpdate()
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastSale ? (int) substr($lastSale->sale_number, -4) + 1 : 1;

        return 'SO' . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
