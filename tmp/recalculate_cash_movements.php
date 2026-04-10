<?php

use App\Models\Bank;
use App\Models\CashMovement;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$banks = Bank::all();

foreach ($banks as $bank) {
    echo "Recalculating movements for Bank: {$bank->name} (ID: {$bank->id})\n";
    
    $movements = CashMovement::where('bank_id', $bank->id)
        ->orderBy('movement_date', 'asc')
        ->orderBy('created_at', 'asc')
        ->orderBy('id', 'asc')
        ->get();
    
    $balance = 0;
    
    foreach ($movements as $movement) {
        $debit = (float) $movement->debit;
        $credit = (float) $movement->credit;
        
        $balance = round($balance + $debit - $credit, 2);
        
        // Only update if balance is different to save time/resources
        if (abs((float)$movement->balance - $balance) > 0.001) {
            $movement->update(['balance' => $balance]);
        }
    }
    
    // Update the bank's current balance to match the last movement
    $bank->update(['balance' => $balance]);
    
    echo "Final Balance for {$bank->name}: $balance\n\n";
}

echo "Recalculation complete.\n";
