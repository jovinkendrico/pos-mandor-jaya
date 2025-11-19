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

    /**
     * Generate unique payment number for purchase payment
     */
    public static function generatePaymentNumber(): string
    {
        $date = now()->format('Ymd');
        $lastPayment = static::whereDate('created_at', today())
            ->where('payment_number', 'like', 'PP' . $date . '%')
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastPayment ? (int) substr($lastPayment->payment_number, -4) + 1 : 1;

        return 'PP' . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
