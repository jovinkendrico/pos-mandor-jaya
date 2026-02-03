<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CashMovement extends Model
{
    use \App\Traits\HasBranchScope;
    protected $fillable = [
        'bank_id',
        'reference_type',
        'reference_id',
        'movement_date',
        'debit',
        'credit',
        'balance',
        'description',
    ];

    protected $casts = [
        'movement_date' => 'date',
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    /**
     * Get the bank that owns the cash movement.
     */
    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    /**
     * Get the parent reference model (polymorphic).
     */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}
