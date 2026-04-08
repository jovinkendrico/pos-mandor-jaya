<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    // 1. Find invalid CashMovement entries (draft/deleted)
    $sqlCM = "
        SELECT cm.id, cm.reference_type, cm.reference_id, cm.debit, cm.credit
        FROM cash_movements cm
        LEFT JOIN cash_outs co ON cm.reference_type = 'CashOut' AND cm.reference_id = co.id
        LEFT JOIN cash_ins ci ON cm.reference_type = 'CashIn' AND cm.reference_id = ci.id
        WHERE cm.bank_id = 1 AND (
            (cm.reference_type = 'CashOut' AND (co.id IS NULL OR co.status = 'draft' OR co.status = 'cancelled' OR co.deleted_at IS NOT NULL))
            OR
            (cm.reference_type = 'CashIn' AND (ci.id IS NULL OR ci.status = 'draft' OR ci.status = 'cancelled' OR ci.deleted_at IS NOT NULL))
        )
    ";
    
    $badCMs = DB::select($sqlCM);
    $badAmount = 0;
    echo "Found " . count($badCMs) . " invalid bad CashMovement records (Draft/Deleted).\n";
    foreach ($badCMs as $cm) {
        $badAmount += ($cm->debit - $cm->credit);
    }
    echo "Total Impact on Bank 1 CashMovement: $badAmount\n";
    
    // 2. Check MemberLoans that might have been impacted
    $missingCredits = DB::select("
        SELECT je.id, je.reference_type, je.reference_id, SUM(jed.debit) as d, SUM(jed.credit) as c
        FROM journal_entries je
        JOIN journal_entry_details jed ON je.id = jed.journal_entry_id
        WHERE je.reference_type = 'MemberLoan' AND je.status = 'posted'
        GROUP BY je.id, je.reference_type, je.reference_id
        HAVING d > c
    ");
    
    echo "Imbalanced MemberLoans:\n";
    print_r($missingCredits);
});
