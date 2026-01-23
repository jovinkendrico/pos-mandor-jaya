<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

use App\Traits\Auditable;

class JournalEntry extends Model
{
    use SoftDeletes, Auditable;

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
     * Format: JRN-YYYYMMDD-XXXXX
     * Example: JRN-20251124-00001
     *
     * This method should be called within a database transaction
     */
    public static function generateJournalNumber(): string
    {
        $date = now()->format('Ymd'); // YYYYMMDD format
        $prefix = 'JRN-' . $date . '-';

        // Use a transaction with proper locking to prevent race conditions
        return DB::transaction(function () use ($prefix) {
            // Lock all rows with the same prefix to prevent concurrent access
            $lastJournal = DB::table('journal_entries')
                ->where('journal_number', 'like', $prefix . '%')
                ->lockForUpdate()
                ->orderBy('journal_number', 'desc')
                ->value('journal_number');

            // Extract sequence number from format JRN-YYYYMMDD-XXXXX
            // Handle both old 4-digit and new 5-digit formats
            if ($lastJournal) {
                // Get the part after the last dash
                $parts = explode('-', $lastJournal);
                $lastSequence = end($parts);
                $sequence = (int) $lastSequence + 1;
            } else {
                $sequence = 1;
            }

            // Always use 5 digits for sequence number (XXXXX)
            $journalNumber = $prefix . str_pad($sequence, 5, '0', STR_PAD_LEFT);

            // Double check if number already exists (shouldn't happen with proper locking, but just in case)
            $exists = DB::table('journal_entries')
                ->where('journal_number', $journalNumber)
                ->lockForUpdate()
                ->exists();

            if ($exists) {
                // If it exists, find the actual last number again
                $actualLast = DB::table('journal_entries')
                    ->where('journal_number', 'like', $prefix . '%')
                    ->lockForUpdate()
                    ->orderBy('journal_number', 'desc')
                    ->value('journal_number');

                if ($actualLast) {
                    $parts = explode('-', $actualLast);
                    $lastSequence = end($parts);
                    $sequence = (int) $lastSequence + 1;
                } else {
                    $sequence = 1;
                }

                $journalNumber = $prefix . str_pad($sequence, 5, '0', STR_PAD_LEFT);
            }

            return $journalNumber;
        }, 5); // Retry up to 5 times if deadlock occurs
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
