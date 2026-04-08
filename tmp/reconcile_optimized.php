<?php

use Illuminate\Support\Facades\DB;
use App\Models\JournalEntry;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    $bankId = 1;
    $coaId = 2; // Kas Mahato

    echo "=== OPTIMIZED RECONCILIATION FOR KAS MAHATO ===\n";

    // 1. Start Clean for this COA
    $deletedCount = DB::table('journal_entry_details')->where('chart_of_account_id', $coaId)->delete();
    echo "Deleted $deletedCount old Kas Mahato legs.\n";

    // 2. Pre-fetch all Journal Entries for matching
    $journals = DB::table('journal_entries')->get()->groupBy(function($item) {
        // Normalize type to handle both short and long names
        $type = str_replace('App\\Models\\', '', $item->reference_type);
        return $type . '|' . $item->reference_id;
    });

    // 3. Pre-fetch CashOut/CashIn parent relationships
    $cashOuts = DB::table('cash_outs')->get()->keyBy('id');
    $cashIns = DB::table('cash_ins')->get()->keyBy('id');

    // 4. Fetch all CashMovements
    $movements = DB::table('cash_movements')->where('bank_id', $bankId)->get();
    
    $synced = 0;
    $createdJE = 0;
    $missingParentCount = 0;
    $now = now();

    foreach ($movements as $cm) {
        $foundJE = null;
        $refType = $cm->reference_type;
        $refId = $cm->reference_id;

        // Determine lookup key
        $lookupKey = null;

        if ($refType === 'CashOut' || $refType === 'CashIn') {
            $record = ($refType === 'CashOut') ? ($cashOuts[$refId] ?? null) : ($cashIns[$refId] ?? null);
            
            if ($record && $record->reference_type && $record->reference_type !== 'Manual') {
                $parentType = str_replace('App\\Models\\', '', $record->reference_type);
                $lookupKey = $parentType . '|' . $record->reference_id;
            } else {
                $lookupKey = $refType . '|' . $refId;
            }
        } else {
            $lookupKey = str_replace('App\\Models\\', '', $refType) . '|' . $refId;
        }

        // Search in pre-fetched journals
        if ($lookupKey && isset($journals[$lookupKey])) {
            $foundJE = $journals[$lookupKey]->first();
        }

        // If not found, check if we should create a JE for manual CashOut/CashIn
        if (!$foundJE && ($refType === 'CashOut' || $refType === 'CashIn')) {
            $record = ($refType === 'CashOut') ? ($cashOuts[$refId] ?? null) : ($cashIns[$refId] ?? null);
            if ($record && $record->chart_of_account_id) {
                $newJEId = DB::table('journal_entries')->insertGetId([
                    'journal_number' => JournalEntry::generateJournalNumber(),
                    'journal_date'   => $cm->movement_date,
                    'reference_type' => $refType,
                    'reference_id'   => $refId,
                    'description'    => $cm->description,
                    'status'         => 'posted',
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ]);
                
                // Create the other side leg
                DB::table('journal_entry_details')->insert([
                    'journal_entry_id'    => $newJEId,
                    'chart_of_account_id' => $record->chart_of_account_id,
                    'debit'               => $cm->credit, // Flip mapping
                    'credit'              => $cm->debit,
                    'description'         => $cm->description,
                    'created_at'          => $now,
                    'updated_at'          => $now,
                ]);

                $foundJE = (object)['id' => $newJEId];
                $createdJE++;
            }
        }

        // Add the bank leg
        if ($foundJE) {
            DB::table('journal_entry_details')->insert([
                'journal_entry_id'    => $foundJE->id,
                'chart_of_account_id' => $coaId,
                'debit'               => $cm->debit,
                'credit'              => $cm->credit,
                'description'         => $cm->description,
                'created_at'          => $now,
                'updated_at'          => $now,
            ]);
            $synced++;
        } else {
            $missingParentCount++;
            echo "Missing JE for Movement ID {$cm->id} ($lookupKey)\n";
        }
    }

    echo "\nReconciliation finished.\n";
    echo "Summary:\n";
    echo "- Legs Synced to Journals: $synced\n";
    echo "- New Journals Reconstructed: $createdJE\n";
    echo "- Movements Missing Journals: $missingParentCount\n";

    // Final balance validation
    $actualBankBalance = DB::table('banks')->where('id', 1)->value('balance');
    $journalNetBalance = DB::table('journal_entry_details')
        ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.status', 'posted')
        ->where('chart_of_account_id', $coaId)
        ->sum(DB::raw('debit - credit'));

    echo "\nFINAL BALANCE AUDIT:\n";
    echo "- Recorded Bank Balance: " . number_format($actualBankBalance, 2) . "\n";
    echo "- Total Journal Net Sum: " . number_format($journalNetBalance, 2) . "\n";
    echo "- Discrepancy Amount: " . number_format($actualBankBalance - $journalNetBalance, 2) . "\n";
    
    if (abs($actualBankBalance - $journalNetBalance) < 0.01) {
        echo "SUCCESS: Ledger is perfectly reconciled with the bank profile.\n";
    } else {
        echo "WARNING: There is still a minor discrepancy to investigate.\n";
    }
});
