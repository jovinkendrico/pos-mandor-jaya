<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseReturn extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'return_number',
        'purchase_id',
        'return_date',
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
        'reason',
    ];

    protected $casts = [
        'return_date' => 'date',
        'subtotal' => 'decimal:2',
        'discount1_percent' => 'decimal:2',
        'discount1_amount' => 'decimal:2',
        'discount2_percent' => 'decimal:2',
        'discount2_amount' => 'decimal:2',
        'total_after_discount' => 'decimal:2',
        'ppn_percent' => 'decimal:2',
        'ppn_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(PurchaseReturnDetail::class);
    }

    public static function generateReturnNumber(): string
    {
        $date = now()->format('Ymd');
        $lastReturn = self::whereDate('created_at', now()->toDateString())
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastReturn ? (int) substr($lastReturn->return_number, -6) + 1 : 1;

        return 'RB' . $date . str_pad($sequence, 6, '0', STR_PAD_LEFT);
    }
}
