<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SaleReturn extends Model
{
    use HasFactory, SoftDeletes, \App\Traits\HasBranchScope;

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
        $branchCode = auth()->user()->branch->code ?? 'PST';
        $prefix = 'RJ/' . $branchCode . '/';

        // Use lockForUpdate to prevent race conditions in concurrent requests
        // Include soft deleted records to continue sequence even if return was deleted
        $lastReturn = static::withoutGlobalScope('branch')
            ->where('return_number', 'LIKE', $prefix . '%')
            ->lockForUpdate()
            ->orderByRaw('CAST(SUBSTRING(return_number, LENGTH(?)+1) AS UNSIGNED) DESC', [$prefix])
            ->first();

        // Extract sequence number
        $sequence = 1;
        if ($lastReturn) {
            $sequence = (int) substr($lastReturn->return_number, strlen($prefix)) + 1;
        }

        return $prefix . $sequence;
    }
}
