<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

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
        $maxRetries = 20;
        $retry = 0;

        while ($retry < $maxRetries) {
            try {
                $date = now()->format('Ymd');
                $prefix = 'JRN-' . $date . '-';

                // Use lockForUpdate to prevent race conditions
                // Lock the entire table section to prevent concurrent access
                $lastJournal = DB::table('journal_entries')
                    ->where('journal_number', 'like', $prefix . '%')
                    ->lockForUpdate()
                    ->orderBy('journal_number', 'desc')
                    ->value('journal_number');

                $sequence = $lastJournal ? (int) substr($lastJournal, -4) + 1 : 1;
                $journalNumber = $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);

                // Double check if number already exists (for extra safety)
                $exists = DB::table('journal_entries')
                    ->where('journal_number', $journalNumber)
                    ->lockForUpdate()
                    ->exists();

                if ($exists) {
                    // Find the actual last number again
                    $actualLast = DB::table('journal_entries')
                        ->where('journal_number', 'like', $prefix . '%')
                        ->lockForUpdate()
                        ->orderBy('journal_number', 'desc')
                        ->value('journal_number');
                    $sequence = $actualLast ? (int) substr($actualLast, -4) + 1 : 1;
                    $journalNumber = $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);
                }

                return $journalNumber;
            } catch (\Illuminate\Database\QueryException $e) {
                // If duplicate key error, retry with new sequence
                if ($e->getCode() == 23000 && strpos($e->getMessage(), 'Duplicate entry') !== false) {
                    $retry++;
                    if ($retry >= $maxRetries) {
                        // Last resort: add microsecond to make it unique
                        $date = now()->format('Ymd');
                        $prefix = 'JRN-' . $date . '-';
                        $microsecond = substr((string) microtime(true), -6); // Last 6 digits of microtime
                        return $prefix . str_pad($microsecond, 6, '0', STR_PAD_LEFT);
                    }
                    // Longer delay for retry
                    usleep(rand(5000, 15000));
                    continue;
                }
                throw $e;
            } catch (\Exception $e) {
                $retry++;
                if ($retry >= $maxRetries) {
                    throw $e;
                }
                usleep(rand(5000, 15000));
            }
        }

        // Last resort: use microsecond
        $date = now()->format('Ymd');
        $prefix = 'JRN-' . $date . '-';
        $microsecond = substr((string) microtime(true), -6);
        return $prefix . str_pad($microsecond, 6, '0', STR_PAD_LEFT);
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
