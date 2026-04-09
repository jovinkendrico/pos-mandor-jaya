<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\CashOut;
use App\Services\JournalService;
use App\Services\CashMovementService;

$cutoff = '2026-03-31';

echo "--- POSTING CASHOUT JOURNALS (up to {$cutoff}) ---" . PHP_EOL;

// First: set all draft CashOuts <= 31 Maret to 'posted'
$draftUpdated = CashOut::whereDate('cash_out_date', '<=', $cutoff)
    ->where('status', 'draft')
    ->whereNull('deleted_at')
    ->update(['status' => 'posted']);
echo "Set {$draftUpdated} draft CashOuts to posted." . PHP_EOL;

// Then: find all that still don't have a journal
$cashOuts = CashOut::whereDate('cash_out_date', '<=', $cutoff)
    ->where('status', 'posted')
    ->whereNull('deleted_at')
    ->whereNotIn('id', function($q) {
        $q->select('reference_id')
          ->from('journal_entries')
          ->where('reference_type', 'CashOut')
          ->whereNotNull('reference_id');
    })
    ->orderBy('cash_out_date')
    ->orderBy('id')
    ->get();

echo "Found " . $cashOuts->count() . " CashOuts without journals." . PHP_EOL;

$journalService = app(JournalService::class);
CashMovementService::$skipRecalculate = true;

$successCount = 0;
$errorCount   = 0;

foreach ($cashOuts as $co) {
    try {
        $journalService->postCashOut($co);
        echo "  Posted: {$co->cash_out_number} | {$co->cash_out_date} | " . number_format($co->amount) . " | " . ($co->description ?: 'No desc') . PHP_EOL;
        $successCount++;
    } catch (\Exception $e) {
        echo "  ERROR: {$co->cash_out_number} | " . $e->getMessage() . PHP_EOL;
        $errorCount++;
    }
}

echo PHP_EOL . "--- RECALCULATING BANK BALANCES ---" . PHP_EOL;
CashMovementService::$skipRecalculate = false;
$cashMovementService = app(CashMovementService::class);
foreach (\App\Models\Bank::all() as $bank) {
    $cashMovementService->recalculateBalances($bank, '2020-01-01');
    echo "  {$bank->name}: Rp " . number_format($bank->balance) . PHP_EOL;
}

echo PHP_EOL . "--- DONE ---" . PHP_EOL;
echo "  Posted   : {$successCount}" . PHP_EOL;
echo "  Errors   : {$errorCount}" . PHP_EOL;
