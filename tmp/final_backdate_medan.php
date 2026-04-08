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
    echo "Starting FINAL correction for Bank ID $bankId...\n";

    // 1. Backdate Original Opening Balance (THE CORRECT ID: 94)
    $cm94 = CashMovement::find(94);
    if ($cm94) {
        echo "Backdating Opening Balance CM ID 94 to $backdateTo...\n";
        $cm94->update(['movement_date' => $backdateTo]);
    } else {
        echo "Error: CashMovement ID 94 not found.\n";
    }

    // Journal 127
    $je127 = JournalEntry::find(127);
    if ($je127) {
        echo "Backdating Journal ID 127 to $backdateTo...\n";
        $je127->update(['journal_date' => $backdateTo]);
    }

    // 2. Ensure Reversal is also on March 1st (ID 298 from previous script)
    $revCM = CashMovement::where('description', 'like', '%Pembalikan%')
        ->where('bank_id', $bankId)
        ->latest()
        ->first();

    if ($revCM) {
        echo "Ensuring Reversal CM ID {$revCM->id} is on $backdateTo...\n";
        $revCM->update(['movement_date' => $backdateTo]);
        
        // Match CashOut and Journals
        if ($revCM->reference_type === 'CashOut') {
            CashOut::where('id', $revCM->reference_id)->update(['cash_out_date' => $backdateTo]);
            JournalEntry::where('reference_type', 'CashOut')
                ->where('reference_id', $revCM->reference_id)
                ->update(['journal_date' => $backdateTo]);
        }
    }

    // 3. Trigger Recalculation
    $bank = Bank::find($bankId);
    echo "Triggering FINAL recalculation for bank: {$bank->name} since {$backdateTo}...\n";
    
    app(CashMovementService::class)->recalculateBalances($bank, $backdateTo);
    
    echo "Recalculation finished.\n";
});

echo "Final backdate completed.\n";
