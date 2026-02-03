<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SaleReturn extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'return_number',
        'sale_id',
        'return_date',
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
        'total_profit_adjustment',
        'status',
        'return_type',
        'refund_bank_id',
        'refund_method',
        'reason',
        'allocations',
    ];

    protected $casts = [
        'return_date'             => 'date',
        'subtotal'                => 'decimal:2',
        'discount1_percent'       => 'decimal:2',
        'discount1_amount'        => 'decimal:2',
        'discount2_percent'       => 'decimal:2',
        'discount2_amount'        => 'decimal:2',
        'total_after_discount'    => 'decimal:2',
        'ppn_percent'             => 'decimal:2',
        'ppn_amount'              => 'decimal:2',
        'total_amount'            => 'decimal:2',
        'total_cost'              => 'decimal:2',
        'total_profit_adjustment' => 'decimal:2',
        'allocations'             => 'array',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(SaleReturnDetail::class);
    }

    public static function generateReturnNumber($returnDate = null): string
    {
        // Use lockForUpdate to prevent race conditions in concurrent requests
        // Include soft deleted records to continue sequence even if return was deleted
        $lastReturn = static::withTrashed()
            ->lockForUpdate()
            ->orderBy('id', 'desc')
            ->first();

        // Extract sequence number from last return number (e.g., "RJ123" -> 123)
        $sequence = 1;
        if ($lastReturn && preg_match('/^RJ(\d+)$/', $lastReturn->return_number, $matches)) {
            $sequence = (int) $matches[1] + 1;
        }

        return 'RJ' . $sequence;
    }
}
