<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$bankId = 1;
$coaId = 2;

// CM Net
$cmSql = "
    SELECT reference_type, SUM(debit - credit) as net
    FROM cash_movements
    WHERE bank_id = ? AND reference_type IS NOT NULL
    GROUP BY reference_type
";
$cms = DB::select($cmSql, [$bankId]);

// JE Net
$jeSql = "
    SELECT je.reference_type, SUM(jed.debit - jed.credit) as net
    FROM journal_entries je
    JOIN journal_entry_details jed ON je.id = jed.journal_entry_id
    WHERE jed.chart_of_account_id = ? AND je.status = 'posted' AND je.reference_type IS NOT NULL
    GROUP BY je.reference_type
";
$jes = DB::select($jeSql, [$coaId]);

$cmMap = [];
foreach ($cms as $cm) {
    if (!isset($cmMap[$cm->reference_type])) $cmMap[$cm->reference_type] = ['cm' => 0, 'je' => 0];
    $cmMap[$cm->reference_type]['cm'] = $cm->net;
}

foreach ($jes as $je) {
    if (!isset($cmMap[$je->reference_type])) $cmMap[$je->reference_type] = ['cm' => 0, 'je' => 0];
    $cmMap[$je->reference_type]['je'] = $je->net;
}

echo "Reference Type | CM Net | JE Net | Diff (CM - JE)\n";
echo str_repeat("-", 60) . "\n";
foreach ($cmMap as $type => $data) {
    $diff = $data['cm'] - $data['je'];
    echo sprintf("%-25s | %10.2f | %10.2f | %10.2f\n", $type, $data['cm'], $data['je'], $diff);
}
