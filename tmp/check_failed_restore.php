<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Get all IDs from logs
$logs = DB::table('activity_logs')
    ->where('model_type', 'App\\Models\\CashOut')
    ->where('action', 'created')
    ->get();

$logData = [];
foreach ($logs as $log) {
    $d = json_decode($log->new_values, true);
    if ($d && isset($d['id'])) {
        $logData[$d['id']] = $d;
    }
}

// Get existing IDs in DB
$existingIds = DB::table('cash_outs')->pluck('id')->toArray();

// Find failed ones
$failedIds = array_diff(array_keys($logData), $existingIds);

echo "Failed to restore: " . count($failedIds) . PHP_EOL;
echo PHP_EOL;

foreach ($failedIds as $id) {
    $d = $logData[$id];
    // Check what's in DB with same cash_out_number
    $conflict = DB::table('cash_outs')->where('cash_out_number', $d['cash_out_number'])->first();
    echo "ID: {$d['id']} | Num: {$d['cash_out_number']} | Date: {$d['cash_out_date']} | Ref: " . ($d['reference_type'] ?? 'Manual') . " | Amount: " . number_format($d['amount']) . PHP_EOL;
    if ($conflict) {
        echo "  >> CONFLICT with existing ID: {$conflict->id} | Ref: {$conflict->reference_type} | Amount: " . number_format($conflict->amount) . PHP_EOL;
    }
}
