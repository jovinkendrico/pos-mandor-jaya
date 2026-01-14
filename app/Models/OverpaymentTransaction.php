<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class OverpaymentTransaction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'transaction_number',
        'sale_payment_id',
        'purchase_payment_id',
        'transaction_type',
        'amount',
        'transaction_date',
        'bank_id',
        'notes',
        'journal_entry_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'amount' => 'decimal:2',
    ];

    /**
     * Get the sale payment this transaction belongs to.
     */
    public function salePayment(): BelongsTo
    {
        return $this->belongsTo(SalePayment::class);
    }

    /**
     * Get the purchase payment this transaction belongs to.
     */
    public function purchasePayment(): BelongsTo
    {
        return $this->belongsTo(PurchasePayment::class);
    }

    /**
     * Get the bank used for refund.
     */
    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    /**
     * Get the journal entry for this transaction.
     */
    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
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
     * Generate unique transaction number for overpayment transaction
     */
    public static function generateTransactionNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = 'OVP' . $date;

        // Use lockForUpdate to prevent race conditions in concurrent requests
        $lastTransaction = static::withTrashed()
            ->where('transaction_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderBy('transaction_number', 'desc')
            ->first();

        $sequence = $lastTransaction ? (int) substr($lastTransaction->transaction_number, -4) + 1 : 1;

        return $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
