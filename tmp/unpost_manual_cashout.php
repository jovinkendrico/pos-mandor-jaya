<?php

use App\Models\CashOut;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\CashMovement;
use App\Models\Bank;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== UNPOSTING MANUAL CASHOUTS ===" . PHP_EOL;

$manualCashOuts = CashOut::where('status', 'posted')
    ->where(function($q) {
        $q->where('reference_type', 'Manual')
          ->orWhereNull('reference_type')
          ->orWhere('reference_type', '');
    })
    ->get();

if ($manualCashOuts->isEmpty()) {
    echo "No posted manual CashOut records found." . PHP_EOL;
    exit;
}

echo "Found " . $manualCashOuts->count() . " manual CashOut records to unpost." . PHP_EOL;

$bankIds = [];

try {
    DB::transaction(function () use ($manualCashOuts, &$bankIds) {
        foreach ($manualCashOuts as $co) {
            echo "Processing CashOut #{$co->cash_out_number} (Rp " . number_format($co->amount) . ")..." . PHP_EOL;
            
            if ($co->bank_id) {
                $bankIds[$co->bank_id] = true;
            }

            // 1. Delete associated JournalEntry
            $journalEntry = JournalEntry::where('reference_type', 'CashOut')
                ->where('reference_id', $co->id)
                ->first();
            
            if ($journalEntry) {
                JournalEntryDetail::where('journal_entry_id', $journalEntry->id)->delete();
                $journalEntry->delete();
                echo "  - Deleted Journal Entry #{$journalEntry->journal_number}" . PHP_EOL;
            }

            // 2. Delete associated CashMovement
            $deletedMovements = CashMovement::where('reference_type', 'CashOut')
                ->where('reference_id', $co->id)
                ->delete();
            
            if ($deletedMovements > 0) {
                echo "  - Deleted Cash Movement" . PHP_EOL;
            }

            // 3. Update CashOut status to draft
            $co->update(['status' => 'draft']);
            echo "  - Status set to draft" . PHP_EOL;
        }

        echo PHP_EOL . "=== RECALCULATING BANK BALANCES ===" . PHP_EOL;

        foreach (array_keys($bankIds) as $bankId) {
            $bank = Bank::find($bankId);
            if (!$bank) continue;

            echo "Recalculating balances for Bank: {$bank->name} (initial balance: " . number_format($bank->initial_balance) . ")..." . PHP_EOL;

            // Recalculate all movements for this bank from the beginning
            $movements = CashMovement::where('bank_id', $bankId)
                ->orderBy('movement_date', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            $runningBalance = (float) ($bank->initial_balance ?? 0);

            foreach ($movements as $movement) {
                if ($movement->reference_type === 'Bank') {
                    // For opening balance entries, we reset the running balance
                    $runningBalance = $movement->debit > 0 ? (float) $movement->debit : (0 - (float) $movement->credit);
                } else {
                    $runningBalance = round($runningBalance + (float) $movement->debit - (float) $movement->credit, 2);
                }
                
                $movement->update(['balance' => $runningBalance]);
            }

            // Update bank balance to final result
            $bank->update(['balance' => $runningBalance]);
            echo "  - Final balance: " . number_format($runningBalance) . PHP_EOL;
        }
    });

    echo PHP_EOL . "=== ALL DONE ===" . PHP_EOL;
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
    echo $e->getTraceAsString() . PHP_EOL;
    exit(1);
}
