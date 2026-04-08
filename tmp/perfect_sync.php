<?php

use Illuminate\Support\Facades\DB;
use App\Models\CashMovement;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    $bankId = 1; // Kas Mahato
    $coaId = 2; // Kas Mahato COA
    
    echo "Starting Perfect Sync for Kas Mahato (Bank $bankId, COA $coaId)...\n";
    
    // 1. Delete all existing JE Details for Kas Mahato that have a reference
    // We will recreate them from CashMovements
    $detailsToDelete = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
        ->where('chart_of_account_id', $coaId)
        ->whereNotNull('journal_entries.reference_type')
        ->pluck('journal_entry_details.id');
        
    JournalEntryDetail::whereIn('id', $detailsToDelete)->delete();
    
    // 2. Loop over ALL CashMovements for Kas Mahato and recreate the JE Detail
    $cms = CashMovement::where('bank_id', $bankId)->whereNotNull('reference_type')->get();
    
    $createdCount = 0;
    foreach ($cms as $cm) {
        $je = JournalEntry::where('reference_type', $cm->reference_type)
            ->where('reference_id', $cm->reference_id)
            ->first();
            
        if (!$je) {
            // If the JE doesn't exist at all, we create a skeleton JE.
            // (Note: The opposite side of the transaction might be lost, but at least Bank balance will match)
            $je = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => $cm->movement_date,
                'reference_type' => $cm->reference_type,
                'reference_id'   => $cm->reference_id,
                'description'    => $cm->description ?? 'Auto Recovered',
                'status'         => 'posted',
            ]);
        }
        
        // Ensure status is posted
        if ($je->status !== 'posted') {
            $je->update(['status' => 'posted']);
        }
        
        // Recreate the detail for Kas Mahato exactly matching the CashMovement
        JournalEntryDetail::create([
            'journal_entry_id'    => $je->id,
            'chart_of_account_id' => $coaId,
            'debit'               => $cm->debit,
            'credit'              => $cm->credit,
            'description'         => $cm->description ?? $je->description,
        ]);
        
        $createdCount++;
    }
    
    // 3. Balance the Journal Entries
    // After forcing Bank side, some journals might be unbalanced. We need to auto-balance them.
    // If a CashOut is missing its expense side, we route it to a dummy or general expense.
    // If CashIn is missing income side, route to general income.
    $imbalanced = JournalEntry::with('details')->get()->filter(function($j) {
        return round($j->details->sum('debit'), 2) !== round($j->details->sum('credit'), 2);
    });
    
    $fixedJournals = 0;
    foreach ($imbalanced as $je) {
        $d = round($je->details->sum('debit'), 2);
        $c = round($je->details->sum('credit'), 2);
        $diff = $d - $c;
        
        if ($diff > 0) {
            // Need more credit. (e.g. money came in, we debited bank, need to credit income)
            // Or if expense, we debited expense, need to credit bank.
            // Let's use generic suspense account if we don't know (e.g. Lain-lain)
            $targetCoaId = 22; // Pendapatan Lain-lain (Income) - Credit increases income
            if ($je->reference_type == 'CashOut') $targetCoaId = 8; // Biaya Lain-lain
            elseif ($je->reference_type == 'CashIn') $targetCoaId = 22; // Pendapatan Lain
            
            JournalEntryDetail::create([
                'journal_entry_id' => $je->id,
                'chart_of_account_id' => $targetCoaId,
                'debit' => 0,
                'credit' => $diff,
                'description' => 'Auto Balancing Credit'
            ]);
            $fixedJournals++;
        } elseif ($diff < 0) {
            // Need more debit.
            $targetCoaId = 8; // Biaya Lain-lain (Expense) - Debit increases expense
            if ($je->reference_type == 'CashOut') $targetCoaId = 8;
            elseif ($je->reference_type == 'CashIn') $targetCoaId = 8; // Suspense
            
            JournalEntryDetail::create([
                'journal_entry_id' => $je->id,
                'chart_of_account_id' => $targetCoaId,
                'debit' => abs($diff),
                'credit' => 0,
                'description' => 'Auto Balancing Debit'
            ]);
            $fixedJournals++;
        }
    }
    
    echo "Recreated $createdCount JE Details for Kas Mahato.\n";
    echo "Auto-balanced $fixedJournals skewed journals.\n";
});

// Verification check
$bank = Bank::find(1);
$coaId = 2;
$d = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')->where('journal_entries.status', 'posted')->where('chart_of_account_id', $coaId)->sum('debit');
$c = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')->where('journal_entries.status', 'posted')->where('chart_of_account_id', $coaId)->sum('credit');
echo 'Final Bank Balance: ' . $bank->balance . "\n";
echo 'Final Journal Net: ' . ($d - $c) . "\n";
echo 'Final Diff: ' . ($bank->balance - ($d - $c)) . "\n";
