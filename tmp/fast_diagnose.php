<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Get all Cash Movements for Kas Mahato
$sqlCM = "SELECT reference_type, reference_id, debit, credit FROM cash_movements WHERE bank_id = 1 AND reference_type IS NOT NULL";
$cms = DB::select($sqlCM);

// Get all Journal Details for Kas Mahato
$sqlJE = "
    SELECT je.reference_type, je.reference_id, jed.debit, jed.credit 
    FROM journal_entry_details jed
    JOIN journal_entries je ON jed.journal_entry_id = je.id
    WHERE jed.chart_of_account_id = 2 AND je.status = 'posted' AND je.reference_type IS NOT NULL
";
$jes = DB::select($sqlJE);

$cmMap = [];
foreach ($cms as $cm) {
    $key = $cm->reference_type . '_' . $cm->reference_id;
    $net = $cm->debit - $cm->credit;
    if (!isset($cmMap[$key])) $cmMap[$key] = 0;
    $cmMap[$key] += $net;
}

$jeMap = [];
foreach ($jes as $je) {
    $key = $je->reference_type . '_' . $je->reference_id;
    $net = $je->debit - $je->credit;
    if (!isset($jeMap[$key])) $jeMap[$key] = 0;
    $jeMap[$key] += $net;
}

$mismatch = 0;
foreach ($cmMap as $key => $net) {
    $jeNet = $jeMap[$key] ?? 0;
    if (round($net, 2) != round($jeNet, 2)) {
        echo "MISMATCH $key -> CM Net: $net, JE Net: $jeNet, Diff: " . ($net - $jeNet) . "\n";
        $mismatch += ($net - $jeNet);
    }
}

foreach ($jeMap as $key => $net) {
    if (!isset($cmMap[$key]) && round($net, 2) != 0) {
        echo "ORPHAN JE $key -> JE Net: $net\n";
        $mismatch -= $net; // Subtract because JE Net is higher than CM Net (0)
    }
}

echo "Total Diff Explained: $mismatch\n";

// Also find the MemberLoans
$loans = DB::select("SELECT * FROM member_loans WHERE id IN (23,24)");
echo "Remaining Loans:\n";
print_r($loans);

$jeLoans = DB::select("
    SELECT je.id, je.reference_type, je.reference_id, jed.debit, jed.credit 
    FROM journal_entry_details jed
    JOIN journal_entries je ON jed.journal_entry_id = je.id
    WHERE je.reference_type = 'MemberLoan' AND je.reference_id IN (23,24)
");
echo "Remaining Orphan Loan JEs:\n";
print_r($jeLoans);
