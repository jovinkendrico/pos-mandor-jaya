<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    echo "=== RESTORING THE MISSING LEGS ===\n";

    $bankId = 1;
    $bank = DB::table('banks')->where('id', $bankId)->first();
    $coa2 = $bank->chart_of_account_id ?? 2;

    $restoredPPs = 0;
    $restoredSPs = 0;
    $restoredMLPs = 0;

    echo "Restored $restoredSPs SalePayment legs.\n";
    echo "Restored $restoredMLPs MemberLoanPayment legs.\n";

    // Validate global diff
    $d = DB::table('journal_entry_details')->sum('debit');
    $c = DB::table('journal_entry_details')->sum('credit');
    echo "Global JE Diff (Debit - Credit): " . ($d - $c) . "\n";

    // Validate Kas Mahato Diff
    $d2 = DB::table('journal_entry_details')
        ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.status', 'posted')
        ->where('chart_of_account_id', $coa2)
        ->sum('debit');
        
    $c2 = DB::table('journal_entry_details')
        ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.status', 'posted')
        ->where('chart_of_account_id', $coa2)
        ->sum('credit');
        
    $jeNet2 = $d2 - $c2;
    echo "Kas Mahato Bank Balance: " . $bank->balance . "\n";
    echo "Kas Mahato Journal Net: " . $jeNet2 . "\n";
    echo "Kas Mahato Diff: " . ($bank->balance - $jeNet2) . "\n";
});
