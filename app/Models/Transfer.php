<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

use App\Traits\Auditable;

class Transfer extends Model
{
    use SoftDeletes, Auditable, \App\Traits\HasBranchScope;

    protected $fillable = [
        'transfer_number',
        'transfer_date',
        'from_bank_id',
        'to_bank_id',
        'amount',
        'admin_fee',
        'description',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'transfer_date' => 'date',
        'amount' => 'decimal:2',
        'admin_fee' => 'decimal:2',
    ];

    public function fromBank(): BelongsTo
    {
        return $this->belongsTo(Bank::class, 'from_bank_id');
    }

    public function toBank(): BelongsTo
    {
        return $this->belongsTo(Bank::class, 'to_bank_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function journalEntry(): MorphOne
    {
        return $this->morphOne(JournalEntry::class, 'reference');
    }

    public static function generateTransferNumber(): string
    {
        $branchCode = auth()->user()->branch->code ?? 'PST';
        $date = now()->format('Ymd');
        $prefix = 'TRF/' . $branchCode . '/' . $date . '-';

        return DB::transaction(function () use ($prefix) {
            $last = static::withoutGlobalScope('branch')
                ->where('transfer_number', 'like', $prefix . '%')
                ->lockForUpdate()
                ->orderBy('transfer_number', 'desc')
                ->value('transfer_number');

            if ($last) {
                $parts = explode('-', $last);
                $lastSequence = end($parts);
                $sequence = (int) $lastSequence + 1;
            } else {
                $sequence = 1;
            }

            return $prefix . str_pad($sequence, 5, '0', STR_PAD_LEFT);
        });
    }
}
