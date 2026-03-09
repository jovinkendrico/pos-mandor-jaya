<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Auditable;
use Illuminate\Support\Facades\DB;

class MemberLoan extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'loan_number',
        'member_id',
        'loan_date',
        'amount',
        'bank_id',
        'notes',
        'status',
        'is_opening_balance',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'loan_date'          => 'date:Y-m-d',
        'amount'             => 'decimal:2',
        'is_opening_balance' => 'boolean',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(MemberLoanPayment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get total paid amount from confirmed payments
     */
    public function getTotalPaidAttribute(): float
    {
        return (float) $this->payments()
            ->where('status', 'confirmed')
            ->sum('amount');
    }

    /**
     * Get remaining unpaid amount
     */
    public function getRemainingAmountAttribute(): float
    {
        return round(max(0, (float) $this->amount - $this->total_paid), 2);
    }

    /**
     * Check if loan is fully paid
     */
    public function isFullyPaid(): bool
    {
        return $this->remaining_amount <= 0;
    }

    /**
     * Generate unique loan number PJ1, PJ2, ...
     */
    public static function generateLoanNumber(): string
    {
        $last = static::withTrashed()
            ->where('loan_number', 'LIKE', 'PJ%')
            ->lockForUpdate()
            ->orderByRaw('CAST(SUBSTRING(loan_number, 3) AS UNSIGNED) DESC')
            ->first();

        $sequence = $last ? ((int) substr($last->loan_number, 2)) + 1 : 1;

        return 'PJ' . $sequence;
    }
}
