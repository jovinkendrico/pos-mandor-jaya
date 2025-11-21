<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class JournalEntry extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'journal_number',
        'journal_date',
        'reference_type',
        'reference_id',
        'description',
        'status',
        'reversed_by',
    ];

    protected $casts = [
        'journal_date' => 'date',
    ];

    public function details(): HasMany
    {
        return $this->hasMany(JournalEntryDetail::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo('reference');
    }

    public function reversedBy(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'reversed_by');
    }

    /**
     * Generate unique journal number
     */
    public static function generateJournalNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = 'JRN-' . $date . '-';

        // Use lockForUpdate to prevent race conditions
        $lastJournal = static::withTrashed()
            ->where('journal_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderBy('journal_number', 'desc')
            ->first();

        $sequence = $lastJournal ? (int) substr($lastJournal->journal_number, -4) + 1 : 1;

        return $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Validate that total debit equals total credit
     */
    public function validateBalance(): bool
    {
        $totalDebit = $this->details->sum('debit');
        $totalCredit = $this->details->sum('credit');

        return abs($totalDebit - $totalCredit) < 0.01; // Allow small floating point differences
    }

    /**
     * Get total debit
     */
    public function getTotalDebitAttribute(): float
    {
        return $this->details->sum('debit');
    }

    /**
     * Get total credit
     */
    public function getTotalCreditAttribute(): float
    {
        return $this->details->sum('credit');
    }
}
