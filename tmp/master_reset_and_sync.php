<?php

use App\Models\Bank;
use App\Models\CashIn;
use App\Models\CashOut;
use App\Models\Transfer;
use App\Models\SalePayment;
use App\Models\MemberLoan;
use App\Models\MemberLoanPayment;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\CashMovement;
use App\Models\ChartOfAccount;
use App\Services\JournalService;
use App\Services\CashMovementService;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cutoff = '2026-03-31';

echo "--- STARTING CLEAN MASTER RESET (Cutoff: $cutoff) ---" . PHP_EOL;

// 1. WIPE EVERYTHING ACCOUNTING-RELATED (Maret & April)
// This effectively removes all "Reversals" and "Orphans"
echo "Cleaning slate (deleting all journals and movements)..." . PHP_EOL;
DB::table('journal_entry_details')->delete();
DB::table('journal_entries')->delete();
DB::table('cash_movements')->delete();

// 2. RESET BANK BALANCES TO INITIAL
echo "Resetting bank balances..." . PHP_EOL;
Bank::where('name', 'like', '%Medan%')->update(['initial_balance' => 0]);
Bank::where('name', 'like', '%Mahato%')->update(['initial_balance' => 13057822]);

$banks = Bank::all();
foreach ($banks as $bank) {
    $bank->update(['balance' => $bank->initial_balance]);
    echo "  {$bank->name}: Init = {$bank->initial_balance}" . PHP_EOL;
}

$journalService = app(JournalService::class);
$cashMovementService = app(CashMovementService::class);

// DISABLE AUTOMATIC RECALCULATION FOR SPEED
\App\Services\CashMovementService::$skipRecalculate = true;

DB::transaction(function() use ($cutoff, $journalService, $cashMovementService, $banks) {

    // 3. RE-POST VALID MARCH TRANSACTIONS
    
    // CASH IN (Posted only, ignore cancelled)
    echo "Syncing CashIn..." . PHP_EOL;
    $cashIns = CashIn::whereDate('cash_in_date', '<=', $cutoff)->where('status', 'posted')->orderBy('cash_in_date')->orderBy('id')->get();
    foreach ($cashIns as $ci) {
        $journalService->postCashIn($ci);
    }

    // CASH OUT (Posted only)
    echo "Syncing CashOut..." . PHP_EOL;
    $cashOuts = CashOut::whereDate('cash_out_date', '<=', $cutoff)->where('status', 'posted')->orderBy('cash_out_date')->orderBy('id')->get();
    foreach ($cashOuts as $co) {
        $journalService->postCashOut($co);
    }

    // TRANSFER (Posted only)
    echo "Syncing Transfer..." . PHP_EOL;
    $transfers = Transfer::whereDate('transfer_date', '<=', $cutoff)->where('status', 'posted')->orderBy('transfer_date')->orderBy('id')->get();
    foreach ($transfers as $trf) {
        $fromBank = Bank::find($trf->from_bank_id);
        $toBank = Bank::find($trf->to_bank_id);
        $adminFee = (float)$trf->admin_fee;
        $totalSourceAmount = (float)$trf->amount + $adminFee;

        // Mutasi Keluar dari Asal
        $cashMovementService->createMovement($fromBank, Transfer::class, $trf->id, $trf->transfer_date, 0, $totalSourceAmount, $trf->description);
        // Mutasi Masuk ke Tujuan
        $cashMovementService->createMovement($toBank, Transfer::class, $trf->id, $trf->transfer_date, (float)$trf->amount, 0, $trf->description);

        // Journal
        $journal = JournalEntry::create([
            'journal_number' => JournalEntry::generateJournalNumber(),
            'journal_date'   => $trf->transfer_date,
            'description'    => $trf->description,
            'status'         => 'posted',
            'reference_type' => Transfer::class,
            'reference_id'   => $trf->id,
            'created_by'     => $trf->created_by,
        ]);
        JournalEntryDetail::create(['journal_entry_id' => $journal->id, 'chart_of_account_id' => $fromBank->chart_of_account_id, 'debit' => 0, 'credit' => $totalSourceAmount, 'description' => 'Transfer Keluar']);
        JournalEntryDetail::create(['journal_entry_id' => $journal->id, 'chart_of_account_id' => $toBank->chart_of_account_id, 'debit' => $trf->amount, 'credit' => 0, 'description' => 'Transfer Masuk']);
        if ($adminFee > 0) {
            $adminFeeAccount = ChartOfAccount::where('code', '6109')->first();
            if ($adminFeeAccount) {
                JournalEntryDetail::create(['journal_entry_id' => $journal->id, 'chart_of_account_id' => $adminFeeAccount->id, 'debit' => $adminFee, 'credit' => 0, 'description' => 'Biaya Admin']);
            }
        }
    }

    // SALE PAYMENT (Confirmed)
    echo "Syncing SalePayment..." . PHP_EOL;
    $salePayments = SalePayment::whereDate('payment_date', '<=', $cutoff)->where('status', 'confirmed')->orderBy('payment_date')->orderBy('id')->get();
    foreach ($salePayments as $sp) {
        $receivableAccount = ChartOfAccount::where('code', '1201')->first();
        if ($sp->bank_id && $receivableAccount) {
            $ci = CashIn::create([
                'cash_in_number' => CashIn::generateCashInNumber(),
                'cash_in_date' => $sp->payment_date,
                'bank_id' => $sp->bank_id,
                'chart_of_account_id' => $receivableAccount->id,
                'amount' => $sp->total_amount,
                'description' => "Pembayaran Penjualan #{$sp->payment_number}",
                'status' => 'posted',
                'reference_type' => 'SalePayment',
                'reference_id' => $sp->id,
            ]);
            $journalService->postCashIn($ci);
        }
    }

    // MEMBER LOAN (Confirmed)
    echo "Syncing MemberLoan..." . PHP_EOL;
    $loans = MemberLoan::whereDate('loan_date', '<=', $cutoff)->where('status', 'confirmed')->orderBy('loan_date')->orderBy('id')->get();
    foreach ($loans as $loan) {
        if ($loan->bank_id && !$loan->is_opening_balance) {
             $piutangAccount = ChartOfAccount::where('code', '1202')->first();
             $co = CashOut::create([
                 'cash_out_number' => CashOut::generateCashOutNumber(),
                 'cash_out_date' => $loan->loan_date,
                 'bank_id' => $loan->bank_id,
                 'chart_of_account_id' => $piutangAccount->id,
                 'amount' => $loan->amount,
                 'description' => "Pinjaman Anggota #{$loan->loan_number}",
                 'status' => 'posted',
                 'reference_type' => 'MemberLoan',
                 'reference_id' => $loan->id,
             ]);
             $journalService->postCashOut($co);
        }
    }

    // MEMBER LOAN PAYMENT (Confirmed)
    echo "Syncing MemberLoanPayment..." . PHP_EOL;
    $mlps = MemberLoanPayment::whereDate('payment_date', '<=', $cutoff)->where('status', 'confirmed')->orderBy('payment_date')->orderBy('id')->get();
    foreach ($mlps as $mlp) {
        if ($mlp->bank_id) {
            $piutangAccount = ChartOfAccount::where('code', '1202')->first();
            $ci = CashIn::create([
                'cash_in_number' => CashIn::generateCashInNumber(),
                'cash_in_date' => $mlp->payment_date,
                'bank_id' => $mlp->bank_id,
                'chart_of_account_id' => $piutangAccount->id,
                'amount' => $mlp->amount,
                'description' => "Cicilan Pinjaman #{$mlp->payment_number}",
                'status' => 'posted',
                'reference_type' => 'MemberLoanPayment',
                'reference_id' => $mlp->id,
            ]);
            $journalService->postCashIn($ci);
        }
    }

    // 4. RECALCULATE BALANCES (FINALE)
    echo "Recalculating all balances..." . PHP_EOL;
    \App\Services\CashMovementService::$skipRecalculate = false;
    foreach ($banks as $bank) {
        $cashMovementService->recalculateBalances($bank, '2020-01-01');
        echo "  {$bank->name} Final: {$bank->balance}" . PHP_EOL;
    }
});

echo "--- RESET COMPLETE ---" . PHP_EOL;
