<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'purchase_number',
        'supplier_id',
        'purchase_date',
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
        'status',
        'notes',
    ];

    protected $casts = [
        'purchase_date'        => 'date',
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
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(PurchaseDetail::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'reference_id')
            ->where('reference_type', 'Purchase');
    }

    /**
     * Generate unique purchase number
     */
    public static function generatePurchaseNumber($purchaseDate = null): string
    {
        $date = $purchaseDate ? date('Ymd', strtotime($purchaseDate)) : now()->format('Ymd');

        // Use lockForUpdate to prevent race conditions in concurrent requests
        // Include soft deleted records to continue sequence even if purchase was deleted
        $lastPurchase = static::withTrashed()
            ->whereDate('purchase_date', $purchaseDate ? date('Y-m-d', strtotime($purchaseDate)) : today())
            ->lockForUpdate()
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastPurchase ? (int) substr($lastPurchase->purchase_number, -4) + 1 : 1;

        return 'PO' . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
