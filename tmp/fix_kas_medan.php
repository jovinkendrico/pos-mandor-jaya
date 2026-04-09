<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Bank;
use App\Models\CashMovement;
use App\Models\CashIn;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;

DB::beginTransaction();
try {
    // SESUAI PERMINTAAN: Target CASHBANK ID 1
    $bankId = 1;
    echo "Processing Bank ID $bankId...\n";

    $bank = Bank::find($bankId);
    if ($bank) {
        $bank->initial_balance = 0;
        $bank->save();
        echo "Set initial_balance to 0 for Bank ID $bankId.\n";
    } else {
        echo "Warning: Bank ID $bankId not found.\n";
    }

    // Hapus CashMovement awal (99.900.000)
    $cmInitial = CashMovement::where('bank_id', $bankId)->where('debit', 99900000)->first();
    if ($cmInitial) {
        $cmInitial->delete();
        echo "Deleted CashMovement (Initial Balance 99,900,000)\n";
    } else {
        echo "Initial Balance 99,900,000 not found for Bank ID $bankId.\n";
    }

    // Hapus CashIn 100.000 + Jurnal + CashMovement-nya
    $cashIns = CashIn::where('bank_id', $bankId)->where('amount', 100000)->where('description', 'like', '%saldo awal%')->get();
    foreach($cashIns as $cashIn100k) {
        CashMovement::where('reference_type', 'CashIn')->where('reference_id', $cashIn100k->id)->delete();
        
        $je = JournalEntry::where('reference_type', 'CashIn')->where('reference_id', $cashIn100k->id)->first();
        if ($je) {
            JournalEntryDetail::where('journal_entry_id', $je->id)->delete();
            $je->delete();
        }
        $cashIn100k->delete();
        echo "Deleted CashIn 100k (ID: {$cashIn100k->id}) with 'saldo awal' description.\n";
    }

    // Kalkulasi ulang seluruh pergerakan kas untuk Bank ID 1
    echo "Recalculating balances...\n";
    $movements = CashMovement::where('bank_id', $bankId)
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
    echo "Recalculated " . $movements->count() . " movements.\n";
    echo "New Ending Balance for Bank ID $bankId: " . number_format($runningBalance, 2) . "\n";

    DB::commit();
    echo "Done.\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
