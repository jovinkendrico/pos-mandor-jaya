<?php

use Illuminate\Support\Facades\DB;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\CashIn;
use App\Models\CashOut;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    echo "Reverting bad journal edits...\n";

    // 1. Delete all 'Auto Balancing' details I created
    $deletedBalancing = JournalEntryDetail::where('description', 'like', 'Auto Balancing%')->delete();
    echo "Deleted $deletedBalancing Auto Balancing details.\n";

    // 2. Remove Journals for Draft/Deleted CashOuts
    $badCOs = CashOut::withTrashed()->where(function($q) {
        $q->where('status', 'draft')
          ->orWhere('status', 'cancelled')
          ->orWhereNotNull('deleted_at');
    })->pluck('id')->toArray();

    if (count($badCOs) > 0) {
        $badJEs = JournalEntry::where('reference_type', 'CashOut')
            ->whereIn('reference_id', $badCOs)
            ->get();
        
        $count = 0;
        foreach ($badJEs as $je) {
            JournalEntryDetail::where('journal_entry_id', $je->id)->delete();
            $je->delete();
            $count++;
        }
        echo "Deleted $count Journals for Draft/Cancelled/Deleted CashOuts.\n";
    }

    // 3. Remove Journals for Draft/Deleted CashIns
    $badCIs = CashIn::withTrashed()->where(function($q) {
        $q->where('status', 'draft')
          ->orWhere('status', 'cancelled')
          ->orWhereNotNull('deleted_at');
    })->pluck('id')->toArray();

    if (count($badCIs) > 0) {
        $badJEs = JournalEntry::where('reference_type', 'CashIn')
            ->whereIn('reference_id', $badCIs)
            ->get();
        
        $count = 0;
        foreach ($badJEs as $je) {
            JournalEntryDetail::where('journal_entry_id', $je->id)->delete();
            $je->delete();
            $count++;
        }
        echo "Deleted $count Journals for Draft/Cancelled/Deleted CashIns.\n";
    }

    // 4. Verify Neraca Balance
    $debit = JournalEntryDetail::sum('debit');
    $credit = JournalEntryDetail::sum('credit');
    echo "Total Debit: $debit | Total Credit: $credit | Diff: " . ($debit - $credit) . "\n";
});
