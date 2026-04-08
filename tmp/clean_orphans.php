<?php

use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\CashOut;
use App\Models\CashIn;
use App\Models\MemberLoanPayment;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    echo "Cleaning up Orphan Journal Entries...\n";

    $deletedCount = 0;

    // 1. Check CashOut orphans
    $jes = JournalEntry::where('reference_type', 'CashOut')->get();
    $cashOutIds = CashOut::pluck('id')->toArray();
    foreach ($jes as $je) {
        if (!in_array($je->reference_id, $cashOutIds)) {
            echo "Deleting Orphan JE {$je->id} (CashOut {$je->reference_id})\n";
            JournalEntryDetail::where('journal_entry_id', $je->id)->delete();
            $je->delete();
            $deletedCount++;
        }
    }

    // 2. Check CashIn orphans
    $jes = JournalEntry::where('reference_type', 'CashIn')->get();
    $cashInIds = CashIn::pluck('id')->toArray();
    foreach ($jes as $je) {
        if (!in_array($je->reference_id, $cashInIds)) {
            echo "Deleting Orphan JE {$je->id} (CashIn {$je->reference_id})\n";
            JournalEntryDetail::where('journal_entry_id', $je->id)->delete();
            $je->delete();
            $deletedCount++;
        }
    }

    // 3. Check MemberLoanPayment orphans
    $jes = JournalEntry::where('reference_type', 'MemberLoanPayment')->get();
    $mlpIds = MemberLoanPayment::pluck('id')->toArray();
    foreach ($jes as $je) {
        if (!in_array($je->reference_id, $mlpIds)) {
            echo "Deleting Orphan JE {$je->id} (MemberLoanPayment {$je->reference_id})\n";
            JournalEntryDetail::where('journal_entry_id', $je->id)->delete();
            $je->delete();
            $deletedCount++;
        }
    }
    
    // 4. Also check Bank ID 1 directly to see if any journal has weird amount
    $coas = [2]; // Kas Mahato
    foreach ($coas as $coaId) {
        $d = App\Models\JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.status', 'posted')
            ->where('chart_of_account_id', $coaId)
            ->sum('debit');
        $c = App\Models\JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.status', 'posted')
            ->where('chart_of_account_id', $coaId)
            ->sum('credit');
        $journalNet = $d - $c;
        $bank = App\Models\Bank::where('chart_of_account_id', $coaId)->first();
        if ($bank) {
            echo "Bank {$bank->name} Balance: {$bank->balance} vs Journal Net: {$journalNet} Diff: " . ($bank->balance - $journalNet) . "\n";
        }
    }

    echo "Deleted $deletedCount orphan journal entries.\n";
});
