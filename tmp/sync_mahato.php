<?php

use App\Models\CashMovement;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\Bank;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$bankId = 1; // Kas Mahato
$coaId = 2; // Kas Mahato COA

DB::transaction(function () use ($bankId, $coaId) {
    echo "Starting Sync for Bank ID $bankId (Kas Mahato)...\n";
    
    // 1. Find and Fix Mismatches / Missing Journals
    $movements = CashMovement::where('bank_id', $bankId)->get();
    
    foreach ($movements as $cm) {
        if ($cm->reference_type && $cm->reference_id) {
            $je = JournalEntry::where('reference_type', $cm->reference_type)
                ->where('reference_id', $cm->reference_id)
                ->where('status', 'posted')
                ->first();

            if (!$je) {
                echo "WARNING: No active journal for {$cm->reference_type} {$cm->reference_id}. Cannot safely auto-create without context (CashIn/CashOut/Sale info).\n";
                // Optionally we could call the service here if we load the model
                continue;
            }

            // Check if Kas Mahato COA detail exists in this journal
            $detail = JournalEntryDetail::where('journal_entry_id', $je->id)
                ->where('chart_of_account_id', $coaId)
                ->first();

            if (!$detail) {
                // Determine if we need to add a detail
                echo "Fixing Missing Detail for JE {$je->id} ({$cm->reference_type} {$cm->reference_id})...\n";
                JournalEntryDetail::create([
                    'journal_entry_id' => $je->id,
                    'chart_of_account_id' => $coaId,
                    'debit' => $cm->debit,
                    'credit' => $cm->credit,
                    'description' => "Auto Sync: " . $cm->description,
                ]);
            } else {
                // Check if amounts match
                if (round($cm->debit, 2) != round($detail->debit, 2) || round($cm->credit, 2) != round($detail->credit, 2)) {
                    echo "Fixing Amount Mismatch for JE Detail {$detail->id} (JE {$je->id})...\n";
                    echo "  Old: D={$detail->debit}, C={$detail->credit} | New: D={$cm->debit}, C={$cm->credit}\n";
                    $detail->update([
                        'debit' => $cm->debit,
                        'credit' => $cm->credit,
                    ]);
                }
            }
        }
    }

    // 2. Find and Remove Orphan Journal Details (Affecting Kas Mahato but NOT in Cash Movement)
    $details = JournalEntryDetail::where('chart_of_account_id', $coaId)
        ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.status', 'posted')
        ->select('journal_entry_details.*', 'journal_entries.reference_type', 'journal_entries.reference_id')
        ->get();

    foreach ($details as $detail) {
        if ($detail->reference_type && $detail->reference_id) {
            $cm = CashMovement::where('reference_type', $detail->reference_type)
                ->where('reference_id', $detail->reference_id)
                ->where('bank_id', $bankId)
                ->first();
                
            if (!$cm) {
                echo "Removing Orphan Journal Detail ID {$detail->id} (JE {$detail->journal_entry_id}, Ref: {$detail->reference_type} {$detail->reference_id})...\n";
                JournalEntryDetail::where('id', $detail->id)->delete();
            }
        } else if (!$detail->reference_type && !$detail->reference_id) {
            // Unreferenced journal entry Detail? Wait, JournalEntry itself has reference_type
            // Checked above (it has reference_type from join)
        }
    }

    echo "Sync Complete.\n";
});
