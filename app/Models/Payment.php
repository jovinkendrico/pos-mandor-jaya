<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'payment_number',
        'reference_type',
        'reference_id',
        'payment_date',
        'amount_paid',
        'payment_method',
        'bank_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount_paid' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function details(): HasMany
    {
        return $this->hasMany(PaymentDetail::class);
    }

    /**
     * Get the related purchase or sale
     */
    public function reference()
    {
        if ($this->reference_type === 'Purchase') {
            return $this->belongsTo(Purchase::class, 'reference_id');
        } elseif ($this->reference_type === 'Sale') {
            return $this->belongsTo(Sale::class, 'reference_id');
        }
        return null;
    }

    /**
     * Generate unique payment number
     */
    public static function generatePaymentNumber(): string
    {
        $date = now()->format('Ymd');
        $lastPayment = static::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastPayment ? (int) substr($lastPayment->payment_number, -4) + 1 : 1;

        return 'PAY' . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get total paid amount for a transaction
     */
    public static function getTotalPaid(string $referenceType, int $referenceId): float
    {
        return static::where('reference_type', $referenceType)
            ->where('reference_id', $referenceId)
            ->sum('amount_paid');
    }

    /**
     * Check if transaction is fully paid
     */
    public static function isFullyPaid(string $referenceType, int $referenceId, float $totalAmount): bool
    {
        $totalPaid = static::getTotalPaid($referenceType, $referenceId);
        return $totalPaid >= $totalAmount;
    }
}
