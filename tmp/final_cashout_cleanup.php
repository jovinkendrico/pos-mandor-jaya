<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "--- FINAL CASHOUT CLEANUP ---" . PHP_EOL;

// 1. Find all CashOut IDs that were SOFT DELETED in the original system
//    by looking for 'deleted' action in activity_logs
$deletedLogs = DB::table('activity_logs')
    ->where('model_type', 'App\\Models\\CashOut')
    ->where('action', 'deleted')
    ->get();

$originallyDeletedIds = [];
foreach ($deletedLogs as $log) {
    // The model_id is the ID of the record that was deleted
    if ($log->model_id) {
        $originallyDeletedIds[] = $log->model_id;
    }
}

$originallyDeletedIds = array_unique($originallyDeletedIds);
echo "Found " . count($originallyDeletedIds) . " CashOut records that were deleted in original system." . PHP_EOL;

// 2. Also find records whose original log data shows deleted_at was set
$createdLogs = DB::table('activity_logs')
    ->where('model_type', 'App\\Models\\CashOut')
    ->where('action', 'created')
    ->get();

$createdWithDeletedAt = [];
foreach ($createdLogs as $log) {
    $d = json_decode($log->new_values, true);
    if ($d && isset($d['id']) && !empty($d['deleted_at'])) {
        $createdWithDeletedAt[] = $d['id'];
    }
}

$allToDelete = array_unique(array_merge($originallyDeletedIds, $createdWithDeletedAt));
echo "Total to hard delete: " . count($allToDelete) . PHP_EOL;

// 3. Hard delete those from cash_outs
if (!empty($allToDelete)) {
    $deleted = DB::table('cash_outs')->whereIn('id', $allToDelete)->delete();
    echo "  Hard deleted: {$deleted} records." . PHP_EOL;
}

// 4. Also remove any MemberLoan CashOut duplicates
//    (MemberLoan CashOuts are re-created by reconstruction script, 
//     old restored ones with different IDs/numbers are duplicates)
// Find MemberLoan CashOuts where reference_id has more than one CashOut 
echo PHP_EOL . "Checking for duplicate MemberLoan CashOuts..." . PHP_EOL;
$memberLoanCOs = DB::table('cash_outs')
    ->whereNull('deleted_at')
    ->where('reference_type', 'MemberLoan')
    ->select('reference_id', DB::raw('COUNT(*) as cnt'), DB::raw('GROUP_CONCAT(id ORDER BY id ASC) as ids'))
    ->groupBy('reference_id')
    ->having('cnt', '>', 1)
    ->get();

$duplicatesRemoved = 0;
foreach ($memberLoanCOs as $dup) {
    $ids = explode(',', $dup->ids);
    // Keep the LATEST one (highest ID = created by reconstruction = correct one)
    $keepId = max($ids);
    $removeIds = array_filter($ids, fn($id) => $id != $keepId);
    if (!empty($removeIds)) {
        DB::table('cash_outs')->whereIn('id', $removeIds)->delete();
        $duplicatesRemoved += count($removeIds);
        echo "  Loan #{$dup->reference_id}: kept ID {$keepId}, removed " . implode(',', $removeIds) . PHP_EOL;
    }
}
echo "  Removed {$duplicatesRemoved} duplicate MemberLoan CashOuts." . PHP_EOL;

echo PHP_EOL . "--- FINAL COUNTS ---" . PHP_EOL;
echo "Total CashOut (active): " . DB::table('cash_outs')->whereNull('deleted_at')->count() . PHP_EOL;
echo "  Manual: " . DB::table('cash_outs')->whereNull('deleted_at')->where('reference_type', 'Manual')->count() . PHP_EOL;
echo "  MemberLoan: " . DB::table('cash_outs')->whereNull('deleted_at')->where('reference_type', 'MemberLoan')->count() . PHP_EOL;
echo "  Other refs: " . DB::table('cash_outs')->whereNull('deleted_at')->whereNotIn('reference_type', ['Manual', 'MemberLoan'])->count() . PHP_EOL;
