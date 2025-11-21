<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CashIn extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'cash_in_number',
        'cash_in_date',
        'bank_id',
        'chart_of_account_id',
        'amount',
        'description',
        'status',
        'reference_type',
        'reference_id',
    ];

    protected $casts = [
        'cash_in_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    public function chartOfAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo('reference');
    }

    /**
     * Generate unique cash in number
     */
    public static function generateCashInNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = 'CI' . $date;

        // Use lockForUpdate to prevent race conditions
        $lastCashIn = static::withTrashed()
            ->where('cash_in_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderBy('cash_in_number', 'desc')
            ->first();

        $sequence = $lastCashIn ? (int) substr($lastCashIn->cash_in_number, -4) + 1 : 1;

        return $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
