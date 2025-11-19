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

    /**
     * Generate unique payment number for sale payment
     */
    public static function generatePaymentNumber(): string
    {
        $date = now()->format('Ymd');
        $lastPayment = static::whereDate('created_at', today())
            ->where('payment_number', 'like', 'SP' . $date . '%')
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastPayment ? (int) substr($lastPayment->payment_number, -4) + 1 : 1;

        return 'SP' . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
