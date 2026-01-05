<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Purchase extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'purchase_number',
        'supplier_id',
        'purchase_date',
        'due_date',
        'subtotal',
        'discount1_percent',
        'discount1_amount',
        'discount2_percent',
        'discount2_amount',
        'total_after_discount',
        'ppn_percent',
        'ppn_amount',
        'total_amount',
        'status',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'purchase_date'        => 'date',
        'due_date'             => 'date',
        'subtotal'             => 'decimal:2',
        'discount1_percent'    => 'decimal:2',
        'discount1_amount'     => 'decimal:2',
        'discount2_percent'    => 'decimal:2',
        'discount2_amount'     => 'decimal:2',
        'total_after_discount' => 'decimal:2',
        'ppn_percent'          => 'decimal:2',
        'ppn_amount'           => 'decimal:2',
        'total_amount'         => 'decimal:2',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(PurchaseDetail::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'reference_id')
            ->where('reference_type', 'Purchase');
    }

    public function payments(): BelongsToMany
    {
        return $this->belongsToMany(PurchasePayment::class, 'purchase_payment_items')
            ->withPivot('amount')
            ->withTimestamps();
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
     * Get total paid amount
     */
    public function getTotalPaidAttribute(): float
    {
        return DB::table('purchase_payment_items')
            ->join('purchase_payments', 'purchase_payment_items.purchase_payment_id', '=', 'purchase_payments.id')
            ->where('purchase_payment_items.purchase_id', $this->id)
            ->where('purchase_payments.status', 'confirmed')
            ->sum('purchase_payment_items.amount') ?? 0;
    }

    /**
     * Get remaining amount to pay
     */
    public function getRemainingAmountAttribute(): float
    {
        return max(0, $this->total_amount - $this->total_paid);
    }

    /**
     * Check if purchase is fully paid
     */
    public function isFullyPaid(): bool
    {
        return $this->remaining_amount <= 0;
    }

    /**
     * Generate unique purchase number
     */
    public static function generatePurchaseNumber($purchaseDate = null): string
    {
        // Find the last purchase that starts with 'MB'
        $lastPurchase = static::withTrashed()
            ->where('purchase_number', 'LIKE', 'MB%')
            ->orderByRaw('CAST(SUBSTRING(purchase_number, 3) AS UNSIGNED) DESC')
            ->first();

        if ($lastPurchase) {
            // Get the numeric part after 'MB'
            $lastNumber = (int) substr($lastPurchase->purchase_number, 2);
            $sequence   = $lastNumber + 1;
        } else {
            $sequence = 1;
        }

        return 'MB' . $sequence;
    }

    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                $query->where('purchase_number', 'like', '%' . $search . '%')
                    ->orWhere('notes', 'like', '%' . $search . '%')
                    ->orWhereHas('supplier', function ($query) use ($search) {
                        $query->where('name', 'like', '%' . $search . '%');
                    });
            });
        });
    }
}
