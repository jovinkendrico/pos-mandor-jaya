<?php

use Illuminate\Support\Facades\DB;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    $bankId = 1;
    $coaId = 2; // Kas Mahato

    echo "Starting final reconciliation for Kas Mahato...\n";

    // 1. Delete all existing legs for Kas Mahato to start clean
    $deleted = DB::table('journal_entry_details')
        ->where('chart_of_account_id', $coaId)
        ->delete();
    echo "Deleted $deleted old Kas Mahato legs.\n";

    // 2. Fetch all CashMovements for this bank
    $movements = DB::table('cash_movements')
        ->where('bank_id', $bankId)
        ->get();

    $synced = 0;
    $createdJE = 0;
    $missingParentCount = 0;

    foreach ($movements as $cm) {
        $jeId = null;
        $refType = $cm->reference_type;
        $refId = $cm->reference_id;

        // Logic to find the correct JournalEntry
        if ($refType === 'CashOut' || $refType === 'CashIn') {
            $table = ($refType === 'CashOut') ? 'cash_outs' : 'cash_ins';
            $record = DB::table($table)->where('id', $refId)->first();
            
            if ($record && $record->reference_type && $record->reference_type !== 'Manual') {
                // This is a derived record (e.g., SalePayment, Transfer, etc.)
                // The JournalEntry should be linked to the parent
                $parentType = $record->reference_type;
                $parentId = $record->reference_id;
                
                // Try with both short name and full namespace
                $jeId = DB::table('journal_entries')
                    ->where('reference_id', $parentId)
                    ->where(function($q) use ($parentType) {
                        $q->where('reference_type', $parentType)
                          ->orWhere('reference_type', 'App\\Models\\' . $parentType);
                    })
                    ->value('id');
            } else {
                // Standard CashOut/CashIn
                $jeId = DB::table('journal_entries')
                    ->where('reference_type', $refType)
                    ->where('reference_id', $refId)
                    ->value('id');
            }
        } else {
            // Other types (Transfer Masuk/Keluar direct, etc.)
            $jeId = DB::table('journal_entries')
                ->where('reference_id', $refId)
                ->where(function($q) use ($refType) {
                    $q->where('reference_type', $refType)
                      ->orWhere('reference_type', 'App\\Models\\' . $refType);
                })
                ->value('id');
        }

        // 3. If no JournalEntry exists, we must create one to maintain balance
        if (!$jeId) {
            // For CashOut/CashIn, we can reconstruct
            if ($refType === 'CashOut' || $refType === 'CashIn') {
                $table = ($refType === 'CashOut') ? 'cash_outs' : 'cash_ins';
                $record = DB::table($table)->where('id', $refId)->first();
                if ($record) {
                    $otherCoa = $record->chart_of_account_id;
                    if ($otherCoa) {
                        $jeId = DB::table('journal_entries')->insertGetId([
                            'journal_number' => JournalEntry::generateJournalNumber(),
                            'journal_date'   => $cm->movement_date,
                            'reference_type' => $refType,
                            'reference_id'   => $refId,
                            'description'    => $cm->description,
                            'status'         => 'posted',
                            'created_at'     => now(),
                            'updated_at'     => now(),
                        ]);
                        // Add the "Other Side"
                        DB::table('journal_entry_details')->insert([
                            'journal_entry_id'    => $jeId,
                            'chart_of_account_id' => $otherCoa,
                            'debit'               => $cm->credit, // Flip for other side
                            'credit'              => $cm->debit,
                            'description'         => $cm->description,
                            'created_at'          => now(),
                            'updated_at'          => now(),
                        ]);
                        $createdJE++;
                    }
                }
            }
        }

        // 4. Insert the Kas Mahato leg
        if ($jeId) {
            DB::table('journal_entry_details')->insert([
                'journal_entry_id'    => $jeId,
                'chart_of_account_id' => $coaId,
                'debit'               => $cm->debit,
                'credit'              => $cm->credit,
                'description'         => $cm->description,
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);
            $synced++;
        } else {
            $missingParentCount++;
        }
    }

    echo "Summary:\n";
    echo "- Legs Synced: $synced\n";
    echo "- New Journals Created: $createdJE\n";
    echo "- Missing Parent Journals (Manual action needed): $missingParentCount\n";

    // Final checks
    $bankBalance = DB::table('banks')->where('id', 1)->value('balance');
    $journalNet = DB::table('journal_entry_details')
        ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.status', 'posted')
        ->where('chart_of_account_id', $coaId)
        ->sum(DB::raw('debit - credit'));

    echo "Result:\n";
    echo "- Bank Balance: $bankBalance\n";
    echo "- Journal Net: $journalNet\n";
    echo "- Difference: " . ($bankBalance - $journalNet) . "\n";
});
