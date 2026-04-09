<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\CashOut;

echo "--- RESTORING 48 FAILED MANUAL CASHOUT RECORDS ---" . PHP_EOL;

// Get all log data
$logs = DB::table('activity_logs')
    ->where('model_type', 'App\\Models\\CashOut')
    ->where('action', 'created')
    ->get();

$logData = [];
foreach ($logs as $log) {
    $d = json_decode($log->new_values, true);
    if ($d && isset($d['id'])) {
        $logData[$d['id']] = ['data' => $d, 'created_at' => $log->created_at];
    }
}

// Get existing IDs in DB
$existingIds = DB::table('cash_outs')->pluck('id')->toArray();

// Find failed ones
$failedIds = array_diff(array_keys($logData), $existingIds);

$restoredCount = 0;
$skippedCount  = 0;

foreach ($failedIds as $id) {
    $d          = $logData[$id]['data'];
    $createdAt  = $logData[$id]['created_at'];
    $refType    = $d['reference_type'] ?? null;

    // Skip the Rp1 Miliar fake record (ID 293)
    if ((int)$id === 293) {
        echo "  SKIP ID 293 (Rp1 Miliar - already requested to delete)" . PHP_EOL;
        $skippedCount++;
        continue;
    }

    // Skip MemberLoan ones — already handled by reconstruction
    if ($refType === 'MemberLoan') {
        echo "  SKIP ID {$id} (MemberLoan - already in system)" . PHP_EOL;
        $skippedCount++;
        continue;
    }

    // Generate a new unique cash_out_number for this record
    $newNumber = CashOut::generateCashOutNumber();

    try {
        DB::table('cash_outs')->insert([
            'id'                  => $d['id'],
            'cash_out_number'     => $newNumber,  // New unique number
            'cash_out_date'       => $d['cash_out_date'] ?? null,
            'bank_id'             => $d['bank_id'] ?? null,
            'chart_of_account_id' => $d['chart_of_account_id'] ?? null,
            'amount'              => $d['amount'] ?? 0,
            'description'         => $d['description'] ?? null,
            'status'              => $d['status'] ?? 'draft',
            'reference_type'      => $refType,
            'reference_id'        => $d['reference_id'] ?? null,
            'vehicle_id'          => $d['vehicle_id'] ?? null,
            'attachment'          => $d['attachment'] ?? null,
            'created_by'          => $d['created_by'] ?? null,
            'updated_by'          => $d['updated_by'] ?? null,
            'created_at'          => $createdAt,
            'updated_at'          => $createdAt,
            'deleted_at'          => null,
        ]);

        echo "  Restored ID {$id} | Old: {$d['cash_out_number']} → New: {$newNumber} | {$d['description']}" . PHP_EOL;
        $restoredCount++;
        usleep(5000); // Small delay to ensure unique number generation
    } catch (\Exception $e) {
        echo "  ERROR ID {$id}: " . $e->getMessage() . PHP_EOL;
    }
}

echo PHP_EOL . "--- DONE ---" . PHP_EOL;
echo "  Restored : {$restoredCount}" . PHP_EOL;
echo "  Skipped  : {$skippedCount}" . PHP_EOL;
echo "  Total CashOut now: " . DB::table('cash_outs')->count() . PHP_EOL;
