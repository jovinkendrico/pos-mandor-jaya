<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalePayment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'payment_number',
        'payment_date',
        'total_amount',
        'overpayment_amount',
        'overpayment_status',
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
        'overpayment_amount' => 'decimal:2',
    ];

    /**
     * Get the sales this payment covers (many-to-many).
     */
    public function sales(): BelongsToMany
    {
        return $this->belongsToMany(Sale::class, 'sale_payment_items')
            ->withPivot('amount')
            ->withTimestamps();
    }

    /**
     * Get the payment items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(SalePaymentItem::class);
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
     * Get the overpayment transactions for this payment.
     */
    public function overpaymentTransactions(): HasMany
    {
        return $this->hasMany(OverpaymentTransaction::class);
    }

    /**
     * Calculate overpayment amount
     * Overpayment = total amount received from customer - sum of amounts allocated to invoices
     */
    public function calculateOverpayment(): float
    {
        // Load items if not already loaded
        if (!$this->relationLoaded('items')) {
            $this->load('items');
        }

        // Total allocated to invoices
        $totalAllocated = $this->items->sum('amount');

        // Overpayment = total received - total allocated
        // total_amount = total cash received from customer
        // sum of items.amount = total allocated to invoices
        return max(0, (float)$this->total_amount - $totalAllocated);
    }

    /**
     * Check if this payment has overpayment
     */
    public function hasOverpayment(): bool
    {
        return $this->overpayment_amount > 0 && $this->overpayment_status !== 'none';
    }

    /**
     * Generate unique payment number for sale payment
     */
    public static function generatePaymentNumber(): string
    {
        $prefix = 'SP';

        // Use lockForUpdate to prevent race conditions in concurrent requests
        // Include soft deleted records to continue sequence even if payment was deleted
        $lastPayment = static::withTrashed()
            ->where('payment_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderBy('payment_number', 'desc')
            ->first();

        if ($lastPayment) {
            // Extract number after prefix (e.g., "SP123" -> 123)
            $lastNumber = (int) substr($lastPayment->payment_number, strlen($prefix));
            $sequence = $lastNumber + 1;
        } else {
            $sequence = 1;
        }

        return $prefix . $sequence;
    }
}
