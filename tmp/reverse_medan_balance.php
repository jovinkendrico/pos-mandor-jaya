<?php

use App\Models\Bank;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\CashOut;
use App\Models\CashMovement;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$bankId = 3;
$modalCoaId = 28;
$correctionAmount = 1000000000.00;

DB::transaction(function () use ($bankId, $modalCoaId, $correctionAmount) {
    $bank = Bank::lockForUpdate()->find($bankId);
    if (!$bank) {
        die("Bank ID $bankId not found.\n");
    }

    echo "Reversing 1.000.000.000 for Bank: {$bank->name}...\n";

    // 1. Create CashOut for visibility
    $cashOut = CashOut::create([
        'cash_out_number' => CashOut::generateCashOutNumber(),
        'cash_out_date'   => now(),
        'bank_id'         => $bankId,
        'chart_of_account_id' => $modalCoaId, // The "expense" side is Modal reduction
        'amount'          => $correctionAmount,
        'description'     => "Pembalikan Saldo Awal (Koreksi)",
        'status'          => 'posted',
        'reference_type'  => 'Manual',
        'created_by'      => 1, // System/Admin
        'updated_by'      => 1,
    ]);

    // 2. Create Journal Entry
    $journal = JournalEntry::create([
        'journal_number' => JournalEntry::generateJournalNumber(),
        'journal_date'   => now(),
        'description'    => "Pembalikan Saldo Awal KAS Medan (Koreksi)",
        'reference_type' => 'CashOut',
        'reference_id'   => $cashOut->id,
        'status'         => 'posted',
    ]);

    // Debit: Modal (decreasing equity)
    JournalEntryDetail::create([
        'journal_entry_id'    => $journal->id,
        'chart_of_account_id' => $modalCoaId,
        'debit'               => $correctionAmount,
        'credit'              => 0,
        'description'         => "Koreksi saldo awal {$bank->name}",
    ]);

    // Credit: Bank COA (decreasing asset)
    JournalEntryDetail::create([
        'journal_entry_id'    => $journal->id,
        'chart_of_account_id' => $bank->chart_of_account_id,
        'debit'               => 0,
        'credit'              => $correctionAmount,
        'description'         => "Koreksi saldo awal {$bank->name}",
    ]);

    // 3. Create Cash Movement
    app(\App\Services\CashMovementService::class)->createMovement(
        $bank,
        'CashOut',
        $cashOut->id,
        now(),
        0,
        $correctionAmount,
        "Pembalikan Saldo Awal (Koreksi)"
    );

    echo "Correction completed. New balance: {$bank->balance}\n";
});

echo "Script finished.\n";
