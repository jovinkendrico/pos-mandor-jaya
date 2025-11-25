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
     * Format: CIYYYYMMDDXXXXX (5 digits for sequence)
     * Example: CI2025112400001
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

        // Extract sequence from last 5 digits (handle both old 4-digit and new 5-digit formats)
        if ($lastCashIn) {
            $lastNumber = $lastCashIn->cash_in_number;
            // Get the part after the prefix
            $sequencePart = substr($lastNumber, strlen($prefix));
            $sequence = (int) $sequencePart + 1;
        } else {
            $sequence = 1;
        }

        return $prefix . str_pad($sequence, 5, '0', STR_PAD_LEFT);
    }
}
