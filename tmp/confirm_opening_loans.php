<?php

use App\Models\MemberLoan;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== CONFIRMING OPENING BALANCE LOANS ===" . PHP_EOL;

$loans = MemberLoan::where('is_opening_balance', true)
    ->where('status', 'pending')
    ->get();

if ($loans->isEmpty()) {
    echo "No pending opening balance loans found." . PHP_EOL;
    exit;
}

try {
    DB::transaction(function () use ($loans) {
        // Get Piutang Karyawan account (1202)
        $piutangAccount = ChartOfAccount::where('code', '1202')
            ->where('is_active', true)->first();

        if (!$piutangAccount) {
            throw new \Exception('Akun Piutang Karyawan (1202) tidak ditemukan.');
        }

        // Opening balance: Dr. Piutang Karyawan / Cr. Laba Ditahan (3103)
        $retainedEarnings = ChartOfAccount::where('code', '3103')
            ->where('is_active', true)->first();

        if (!$retainedEarnings) {
            throw new \Exception('Akun Laba Ditahan (3103) tidak ditemukan.');
        }

        foreach ($loans as $loan) {
            echo "Processing {$loan->loan_number} for {$loan->member->name} (Rp " . number_format($loan->amount) . ")..." . PHP_EOL;

            $loan->update([
                'status'     => 'confirmed',
                'updated_by' => 1, // System/Admin
            ]);

            $journal = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => $loan->loan_date,
                'description'    => "Saldo Awal Pinjaman - {$loan->member->name} #{$loan->loan_number}",
                'reference_type' => 'MemberLoan',
                'reference_id'   => $loan->id,
                'status'         => 'posted',
            ]);

            JournalEntryDetail::create([
                'journal_entry_id'    => $journal->id,
                'chart_of_account_id' => $piutangAccount->id,
                'debit'               => $loan->amount,
                'credit'              => 0,
                'description'         => "Saldo awal piutang {$loan->member->name}",
            ]);

            JournalEntryDetail::create([
                'journal_entry_id'    => $journal->id,
                'chart_of_account_id' => $retainedEarnings->id,
                'debit'               => 0,
                'credit'              => $loan->amount,
                'description'         => "Saldo awal piutang {$loan->member->name}",
            ]);

            echo "  Journal created: {$journal->journal_number}" . PHP_EOL;
        }
    });

    echo PHP_EOL . "=== ALL DONE ===" . PHP_EOL;
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
