<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CashOut extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'cash_out_number',
        'cash_out_date',
        'bank_id',
        'chart_of_account_id',
        'amount',
        'description',
        'status',
        'reference_type',
        'reference_id',
    ];

    protected $casts = [
        'cash_out_date' => 'date',
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
     * Generate unique cash out number
     */
    public static function generateCashOutNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = 'CO' . $date;

        // Use lockForUpdate to prevent race conditions
        $lastCashOut = static::withTrashed()
            ->where('cash_out_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderBy('cash_out_number', 'desc')
            ->first();

        $sequence = $lastCashOut ? (int) substr($lastCashOut->cash_out_number, -4) + 1 : 1;

        return $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
