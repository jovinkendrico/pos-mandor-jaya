<?php

use App\Models\Bank;
use App\Models\JournalEntry;
use App\Models\CashOut;
use App\Models\CashMovement;
use App\Services\CashMovementService;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$bankId = 3;
$backdateTo = '2026-03-01';

DB::transaction(function () use ($bankId, $backdateTo) {
    // 1. Backdate Original Opening Balance
    // Journal 127
    JournalEntry::where('id', 127)->update(['journal_date' => $backdateTo]);
    // CashMovement 3
    CashMovement::where('id', 3)->update(['movement_date' => $backdateTo]);

    // 2. Backdate Reversal
    $cashOut = CashOut::where('description', 'like', '%Pembalikan%')
        ->where('bank_id', $bankId)
        ->latest()
        ->first();

    if ($cashOut) {
        echo "Backdating reversal (CashOut ID: {$cashOut->id})...\n";
        $cashOut->update(['cash_out_date' => $backdateTo]);
        
        JournalEntry::where('reference_type', 'CashOut')
            ->where('reference_id', $cashOut->id)
            ->update(['journal_date' => $backdateTo]);
            
        CashMovement::where('reference_type', 'CashOut')
            ->where('reference_id', $cashOut->id)
            ->update(['movement_date' => $backdateTo]);
    } else {
        echo "Warning: No reversal CashOut found.\n";
    }

    // 3. Trigger Recalculation
    $bank = Bank::find($bankId);
    echo "Triggering recalculation for bank: {$bank->name} since {$backdateTo}...\n";
    
    app(CashMovementService::class)->recalculateBalances($bank, $backdateTo);
    
    echo "Recalculation finished.\n";
});

echo "Backdate completed.\n";
