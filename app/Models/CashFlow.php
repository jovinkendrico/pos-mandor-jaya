<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CashFlow extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'type',
        'category_id',
        'amount',
        'description',
        'reference_type',
        'reference_id',
        'bank_id',
        'transaction_date',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get cash flow for a specific period
     */
    public static function getCashFlow(string $startDate, string $endDate): array
    {
        $cashIn = static::where('type', 'in')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        $cashOut = static::where('type', 'out')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        return [
            'cash_in' => $cashIn,
            'cash_out' => $cashOut,
            'net_cash_flow' => $cashIn - $cashOut,
        ];
    }

    /**
     * Get cash flow by category for a specific period
     */
    public static function getCashFlowByCategory(string $startDate, string $endDate): \Illuminate\Database\Eloquent\Collection
    {
        return static::with('category')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->selectRaw('category_id, type, SUM(amount) as total_amount')
            ->groupBy('category_id', 'type')
            ->get();
    }

    /**
     * Update bank balance after cash flow transaction
     */
    public static function updateBankBalance(int $bankId): void
    {
        $bank = Bank::find($bankId);
        if ($bank) {
            $cashIn = static::where('bank_id', $bankId)
                ->where('type', 'in')
                ->sum('amount');

            $cashOut = static::where('bank_id', $bankId)
                ->where('type', 'out')
                ->sum('amount');

            $bank->update([
                'balance' => $cashIn - $cashOut
            ]);
        }
    }
}
