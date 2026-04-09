<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "--- RESTORING MISSING CASHOUT RECORDS FROM ACTIVITY LOGS ---" . PHP_EOL;

// Get all CashOut creation logs
$logs = DB::table('activity_logs')
    ->where('model_type', 'App\\Models\\CashOut')
    ->where('action', 'created')
    ->orderBy('id')
    ->get();

echo "Found " . $logs->count() . " CashOut creation logs." . PHP_EOL;

$restoredCount = 0;
$skippedCount = 0;
$errorCount = 0;

foreach ($logs as $log) {
    $data = json_decode($log->new_values, true);
    
    if (!$data || !isset($data['id'])) {
        $errorCount++;
        continue;
    }
    
    // Check if record exists (including soft deleted)
    $exists = DB::table('cash_outs')->where('id', $data['id'])->exists();
    
    if ($exists) {
        $skippedCount++;
        continue;
    }
    
    // Build insertion data - handle missing columns gracefully
    $insertData = [
        'id'                   => $data['id'],
        'cash_out_number'      => $data['cash_out_number'] ?? null,
        'cash_out_date'        => $data['cash_out_date'] ?? null,
        'bank_id'              => $data['bank_id'] ?? null,
        'chart_of_account_id'  => $data['chart_of_account_id'] ?? null,
        'amount'               => $data['amount'] ?? 0,
        'description'          => $data['description'] ?? null,
        'status'               => $data['status'] ?? 'draft',
        'reference_type'       => $data['reference_type'] ?? null,
        'reference_id'         => $data['reference_id'] ?? null,
        'vehicle_id'           => $data['vehicle_id'] ?? null,
        'attachment'           => $data['attachment'] ?? null,
        'created_by'           => $data['created_by'] ?? null,
        'updated_by'           => $data['updated_by'] ?? null,
        'created_at'           => $log->created_at,
        'updated_at'           => $log->created_at,
        'deleted_at'           => null,
    ];
    
    try {
        DB::table('cash_outs')->insert($insertData);
        $restoredCount++;
    } catch (\Exception $e) {
        echo "  Error restoring ID {$data['id']}: " . $e->getMessage() . PHP_EOL;
        $errorCount++;
    }
}

echo "--- RESTORE COMPLETE ---" . PHP_EOL;
echo "  Restored : {$restoredCount}" . PHP_EOL;
echo "  Skipped  : {$skippedCount}" . PHP_EOL;
echo "  Errors   : {$errorCount}" . PHP_EOL;
echo "  Total CashOut now: " . DB::table('cash_outs')->count() . PHP_EOL;
