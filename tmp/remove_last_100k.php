<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\CashMovement;

DB::beginTransaction();
try {
    $cm = CashMovement::find(141);
    if ($cm && $cm->bank_id == 1 && $cm->debit == 100000) {
        $cm->delete();
        echo "Deleted CashMovement #141 (100,000 Saldo Awal)\n";
    }

    echo "Recalculating balances for Bank ID 1...\n";
    $movements = CashMovement::where('bank_id', 1)
        ->orderBy('movement_date', 'asc')
        ->orderBy('id', 'asc')
        ->get();

    $runningBalance = 0; 
    foreach ($movements as $movement) {
        $runningBalance = round($runningBalance + $movement->debit - $movement->credit, 2);
        DB::table('cash_movements')
            ->where('id', $movement->id)
            ->update(['balance' => $runningBalance]);
    }
    
    echo "New Ending Balance for Bank ID 1: " . number_format($runningBalance, 2) . "\n";
    DB::commit();
    echo "Done.\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
