<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Auditable;

class MemberLoanPayment extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'payment_number',
        'member_loan_id',
        'member_id',
        'payment_date',
        'amount',
        'bank_id',
        'notes',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount'       => 'decimal:2',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(MemberLoan::class, 'member_loan_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
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
     * Generate unique payment number BP1, BP2, ...
     */
    public static function generatePaymentNumber(): string
    {
        $last = static::withTrashed()
            ->where('payment_number', 'LIKE', 'BP%')
            ->lockForUpdate()
            ->orderByRaw('CAST(SUBSTRING(payment_number, 3) AS UNSIGNED) DESC')
            ->first();

        $sequence = $last ? ((int) substr($last->payment_number, 2)) + 1 : 1;

        return 'BP' . $sequence;
    }
}
