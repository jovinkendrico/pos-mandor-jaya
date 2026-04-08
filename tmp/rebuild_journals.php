<?php

use App\Models\CashOut;
use App\Models\CashIn;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\Bank;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    echo "Rebuilding Missing Journals...\n";

    $bank = Bank::find(1); // Kas Mahato
    $bankCoaId = $bank->chart_of_account_id;

    $addedCount = 0;

    // 1. Recover CashOuts
    $cashOuts = CashOut::where('bank_id', 1)->get();
    foreach ($cashOuts as $co) {
        $je = JournalEntry::where('reference_type', 'CashOut')
            ->where('reference_id', $co->id)
            ->where('status', 'posted')
            ->first();

        if (!$je) {
            echo "Recreating Journal for CashOut {$co->id}...\n";
            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => $co->cash_out_date,
                'reference_type' => 'CashOut',
                'reference_id'   => $co->id,
                'description'    => $co->description ?? "Kas Keluar #{$co->cash_out_number}",
                'status'         => 'posted',
            ]);

            // Debit: Expense Account
            if ($co->chart_of_account_id) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $co->chart_of_account_id,
                    'debit'               => $co->amount,
                    'credit'              => 0,
                    'description'         => $co->description ?? "Kas Keluar #{$co->cash_out_number}",
                ]);
            }

            // Credit: Bank Account
            JournalEntryDetail::create([
                'journal_entry_id'    => $journalEntry->id,
                'chart_of_account_id' => $bankCoaId,
                'debit'               => 0,
                'credit'              => $co->amount,
                'description'         => $co->description ?? "Kas Keluar #{$co->cash_out_number}",
            ]);
            
            $addedCount++;
        }
    }

    // 2. Recover CashIns
    $cashIns = CashIn::where('bank_id', 1)->get();
    foreach ($cashIns as $ci) {
        $je = JournalEntry::where('reference_type', 'CashIn')
            ->where('reference_id', $ci->id)
            ->where('status', 'posted')
            ->first();

        if (!$je) {
            echo "Recreating Journal for CashIn {$ci->id}...\n";
            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => $ci->cash_in_date,
                'reference_type' => 'CashIn',
                'reference_id'   => $ci->id,
                'description'    => $ci->description ?? "Kas Masuk #{$ci->cash_in_number}",
                'status'         => 'posted',
            ]);

            // Debit: Bank Account
            JournalEntryDetail::create([
                'journal_entry_id'    => $journalEntry->id,
                'chart_of_account_id' => $bankCoaId,
                'debit'               => $ci->amount,
                'credit'              => 0,
                'description'         => $ci->description ?? "Kas Masuk #{$ci->cash_in_number}",
            ]);

            // Credit: Income Account
            if ($ci->chart_of_account_id) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $ci->chart_of_account_id,
                    'debit'               => 0,
                    'credit'              => $ci->amount,
                    'description'         => $ci->description ?? "Kas Masuk #{$ci->cash_in_number}",
                ]);
            }
            
            $addedCount++;
        }
    }

    echo "Finished! Recreated $addedCount missing journal entries.\n";
});
