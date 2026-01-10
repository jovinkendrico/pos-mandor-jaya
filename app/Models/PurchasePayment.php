<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchasePayment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'payment_number',
        'payment_date',
        'total_amount',
        'bank_id',
        'payment_method',
        'reference_number',
        'notes',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    /**
     * Get the purchases this payment covers (many-to-many).
     */
    public function purchases(): BelongsToMany
    {
        return $this->belongsToMany(Purchase::class, 'purchase_payment_items')
            ->withPivot('amount')
            ->withTimestamps();
    }

    /**
     * Get the payment items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchasePaymentItem::class);
    }

    /**
     * Get the bank used for payment.
     */
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
     * Generate unique payment number for purchase payment
     */
    public static function generatePaymentNumber(): string
    {
        $prefix = 'PP';

        // Use lockForUpdate to prevent race conditions in concurrent requests
        // Include soft deleted records to continue sequence even if payment was deleted
        // Use numeric sorting to get the highest number correctly (PP1, PP2, PP3, PP10...)
        $lastPayment = static::withTrashed()
            ->where('payment_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByRaw('CAST(SUBSTRING(payment_number, 3) AS UNSIGNED) DESC')
            ->first();

        if ($lastPayment) {
            // Extract number after prefix (e.g., "PP123" -> 123)
            $lastNumber = (int) substr($lastPayment->payment_number, strlen($prefix));
            $sequence = $lastNumber + 1;
        } else {
            $sequence = 1;
        }

        return $prefix . $sequence;
    }
}
