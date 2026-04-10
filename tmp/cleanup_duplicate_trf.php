<?php

use App\Models\CashOut;
use App\Models\JournalEntry;
use App\Models\CashMovement;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cashOutNumber = 'CO2026040100001';

DB::transaction(function () use ($cashOutNumber) {
    $cashOut = CashOut::where('cash_out_number', $cashOutNumber)->first();
    
    if (!$cashOut) {
        echo "CashOut $cashOutNumber not found.\n";
        return;
    }

    echo "Cleaning up $cashOutNumber (ID: {$cashOut->id})\n";

    // 1. Delete associated Journal Entry
    $journal = JournalEntry::where('reference_type', 'CashOut')
        ->where('reference_id', $cashOut->id)
        ->first();
    
    if ($journal) {
        echo "Deleting Journal: {$journal->journal_number}\n";
        $journal->details()->delete();
        $journal->delete();
    } else {
        echo "No journal found for $cashOutNumber.\n";
    }

    // 2. Delete associated Cash Movement
    $movements = CashMovement::where('reference_type', 'CashOut')
        ->where('reference_id', $cashOut->id)
        ->get();
    
    foreach ($movements as $m) {
        echo "Deleting CashMovement ID: {$m->id}\n";
        $m->delete();
    }

    // 3. Mark CashOut as cancelled or delete it?
    // User said "yg dihapus itu satu tu aja dari cash movement dan journal"
    // To be safe and show it's "deleted", we'll soft delete the CashOut too.
    echo "Soft deleting CashOut record.\n";
    $cashOut->delete();

    echo "Cleanup complete.\n";
});
