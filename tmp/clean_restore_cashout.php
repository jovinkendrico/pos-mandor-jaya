<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "--- CLEAN RESTORE CASHOUT FROM LOGS ---" . PHP_EOL;
echo "Only restoring: status=draft|posted AND deleted_at=NULL" . PHP_EOL . PHP_EOL;

// Step 1: Build final state of each CashOut from all logs
// We collect created + updated logs to know the last known state
$allLogs = DB::table('activity_logs')
    ->where('model_type', 'App\\Models\\CashOut')
    ->whereIn('action', ['created', 'updated', 'deleted'])
    ->orderBy('id') // oldest first
    ->get();

// Track final state per model_id
$finalStates = [];
$deletedIds  = [];

foreach ($allLogs as $log) {
    $id = $log->model_id;

    if ($log->action === 'deleted') {
        // Mark as deleted
        $deletedIds[$id] = true;
        continue;
    }

    // For created/updated, get the new_values as the current snapshot
    $data = json_decode($log->new_values, true);
    if ($data && isset($data['id'])) {
        // Always overwrite with latest version
        $finalStates[$data['id']] = $data;
    }
}

echo "Unique CashOut IDs in logs : " . count($finalStates) . PHP_EOL;
echo "IDs that were deleted       : " . count($deletedIds) . PHP_EOL;

// Step 2: Filter - keep only ones NOT deleted AND status in draft/posted
$toRestore = [];
foreach ($finalStates as $id => $data) {
    // Skip if deleted in original system
    if (isset($deletedIds[$id])) continue;
    // Skip if deleted_at was set in the data itself
    if (!empty($data['deleted_at'])) continue;
    // Skip if status is not draft or posted
    $status = $data['status'] ?? '';
    if (!in_array($status, ['draft', 'posted'])) continue;

    $toRestore[$id] = $data;
}

echo "Records to restore          : " . count($toRestore) . PHP_EOL . PHP_EOL;

// Step 3: Wipe current cash_outs
$wiped = DB::table('cash_outs')->delete();
echo "Wiped {$wiped} existing records." . PHP_EOL;

// Step 4: Re-insert clean data
$restored = 0;
$errors   = 0;
ksort($toRestore); // sort by ID

foreach ($toRestore as $id => $data) {
    try {
        DB::table('cash_outs')->insert([
            'id'                  => $data['id'],
            'cash_out_number'     => $data['cash_out_number'] ?? null,
            'cash_out_date'       => $data['cash_out_date'] ?? null,
            'bank_id'             => $data['bank_id'] ?? null,
            'chart_of_account_id' => $data['chart_of_account_id'] ?? null,
            'amount'              => $data['amount'] ?? 0,
            'description'         => $data['description'] ?? null,
            'status'              => $data['status'] ?? 'draft',
            'reference_type'      => $data['reference_type'] ?? null,
            'reference_id'        => $data['reference_id'] ?? null,
            'vehicle_id'          => $data['vehicle_id'] ?? null,
            'attachment'          => $data['attachment'] ?? null,
            'created_by'          => $data['created_by'] ?? null,
            'updated_by'          => $data['updated_by'] ?? null,
            'created_at'          => $data['created_at'] ?? now(),
            'updated_at'          => $data['updated_at'] ?? now(),
            'deleted_at'          => null,
        ]);
        $restored++;
    } catch (\Exception $e) {
        echo "  ERROR ID {$id}: " . $e->getMessage() . PHP_EOL;
        $errors++;
    }
}

echo PHP_EOL . "--- DONE ---" . PHP_EOL;
echo "  Restored : {$restored}" . PHP_EOL;
echo "  Errors   : {$errors}" . PHP_EOL;
echo "  Total CashOut now: " . DB::table('cash_outs')->count() . PHP_EOL;
echo "  Manual: " . DB::table('cash_outs')->whereNull('reference_type')->orWhere('reference_type', 'Manual')->count() . PHP_EOL;
echo "  MemberLoan: " . DB::table('cash_outs')->where('reference_type', 'MemberLoan')->count() . PHP_EOL;
