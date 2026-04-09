<?php

use App\Models\Bank;
use App\Models\CashIn;
use App\Models\CashOut;
use App\Models\Transfer;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\MemberLoan;
use App\Models\MemberLoanPayment;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\CashMovement;
use App\Models\ChartOfAccount;
use App\Services\JournalService;
use App\Services\StockService;
use App\Services\CashMovementService;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cutoff = '2026-03-31';

echo "=== FULL POSTING ALL MODULES (up to {$cutoff}) ===" . PHP_EOL;

// Ensure core accounts exist
ChartOfAccount::firstOrCreate(['code' => '2105'], ['name' => 'Utang Lain-lain', 'type' => 'liability', 'is_active' => true]);
ChartOfAccount::firstOrCreate(['code' => '4999'], ['name' => 'Selisih Pembulatan', 'type' => 'income', 'is_active' => true]);

// Wipe existing accounting (clean slate)
echo "Wiping journals and movements..." . PHP_EOL;
DB::table('journal_entry_details')->delete();
DB::table('journal_entries')->delete();
DB::table('cash_movements')->delete();

// Delete auto-generated CashIn/CashOut (from SalePayment/MemberLoan confirmations)
// so they get recreated fresh without duplicates
DB::table('cash_ins')->whereNotNull('reference_type')->delete();
DB::table('cash_outs')->where('reference_type', 'MemberLoan')->delete();

// Reset statuses for <= March records
echo "Resetting March statuses..." . PHP_EOL;
Sale::whereDate('sale_date', '<=', $cutoff)->update(['status' => 'pending']);
SalePayment::whereDate('payment_date', '<=', $cutoff)->update(['status' => 'pending']);
MemberLoan::whereDate('loan_date', '<=', $cutoff)->update(['status' => 'pending']);
MemberLoanPayment::whereDate('payment_date', '<=', $cutoff)->update(['status' => 'pending']);

// Reset bank balances
echo "Resetting bank balances..." . PHP_EOL;
Bank::where('name', 'like', '%Mahato%')->update(['initial_balance' => 13057822]);
Bank::where('name', 'like', '%Medan%')->update(['initial_balance' => 0]);
$banks = Bank::all();
foreach ($banks as $bank) {
    $bank->update(['balance' => $bank->initial_balance]);
    echo "  {$bank->name}: " . number_format($bank->initial_balance) . PHP_EOL;
}

$stockService = app(StockService::class);
$journalService = app(JournalService::class);
$cashMovementService = app(CashMovementService::class);
CashMovementService::$skipRecalculate = true;

DB::transaction(function() use ($cutoff, $stockService, $journalService, $cashMovementService, $banks) {
    $receivableAccount = ChartOfAccount::where('code', '1201')->first();
    $otherPayable      = ChartOfAccount::where('code', '2105')->first();
    $piutangKaryawan   = ChartOfAccount::where('code', '1202')->first() ?? ChartOfAccount::where('code', '1201')->first();

    // ── 1. SALES ──────────────────────────────────────────────────────
    echo PHP_EOL . "[1] Posting Sales..." . PHP_EOL;
    $sales = Sale::whereDate('sale_date', '<=', $cutoff)->orderBy('sale_date')->orderBy('id')->get();
    foreach ($sales as $sale) {
        $stockService->confirmSale($sale);
    }
    echo "  Done: " . $sales->count() . " sales." . PHP_EOL;

    // ── 2. SALE PAYMENTS ──────────────────────────────────────────────
    echo PHP_EOL . "[2] Posting Sale Payments..." . PHP_EOL;
    $payments = SalePayment::whereDate('payment_date', '<=', $cutoff)->orderBy('payment_date')->orderBy('id')->get();
    foreach ($payments as $sp) {
        $overpayment = $sp->calculateOverpayment();
        $sp->update(['status' => 'confirmed', 'overpayment_amount' => $overpayment, 'overpayment_status' => $overpayment > 0 ? 'pending' : 'none']);

        if ($sp->bank_id && $receivableAccount) {
            $ci = CashIn::create([
                'cash_in_number'      => CashIn::generateCashInNumber(),
                'cash_in_date'        => $sp->payment_date,
                'bank_id'             => $sp->bank_id,
                'chart_of_account_id' => $receivableAccount->id,
                'amount'              => $sp->total_amount,
                'description'         => "Pembayaran Penjualan #{$sp->payment_number}",
                'status'              => 'posted',
                'reference_type'      => 'SalePayment',
                'reference_id'        => $sp->id,
            ]);
            $journalService->postCashIn($ci);

            // Overpayment reclassification
            if ($overpayment > 0 && $otherPayable) {
                $journal = JournalEntry::create([
                    'journal_number' => JournalEntry::generateJournalNumber(),
                    'journal_date'   => $sp->payment_date,
                    'reference_type' => 'SalePayment',
                    'reference_id'   => $sp->id,
                    'description'    => "Penyesuaian Kelebihan Bayar #{$sp->payment_number}",
                    'status'         => 'posted',
                ]);
                JournalEntryDetail::create(['journal_entry_id' => $journal->id, 'chart_of_account_id' => $receivableAccount->id, 'debit' => $overpayment, 'credit' => 0, 'description' => 'Penyesuaian piutang']);
                JournalEntryDetail::create(['journal_entry_id' => $journal->id, 'chart_of_account_id' => $otherPayable->id, 'debit' => 0, 'credit' => $overpayment, 'description' => 'Titipan kelebihan bayar']);
            }
        }
    }
    echo "  Done: " . $payments->count() . " payments." . PHP_EOL;

    // ── 3. MEMBER LOANS ───────────────────────────────────────────────
    echo PHP_EOL . "[3] Posting Member Loans..." . PHP_EOL;
    $loans = MemberLoan::whereDate('loan_date', '<=', $cutoff)->orderBy('loan_date')->orderBy('id')->get();
    $loanCount = 0;
    foreach ($loans as $loan) {
        if ($loan->is_opening_balance) continue;
        $loan->update(['status' => 'confirmed']);
        $co = CashOut::create([
            'cash_out_number'     => CashOut::generateCashOutNumber(),
            'cash_out_date'       => $loan->loan_date,
            'bank_id'             => $loan->bank_id,
            'chart_of_account_id' => $piutangKaryawan->id,
            'amount'              => $loan->amount,
            'description'         => "Pinjaman Anggota #{$loan->loan_number}",
            'status'              => 'posted',
            'reference_type'      => 'MemberLoan',
            'reference_id'        => $loan->id,
        ]);
        $journalService->postCashOut($co);
        $loanCount++;
        usleep(5000);
    }
    echo "  Done: {$loanCount} loans." . PHP_EOL;

    // ── 4. TRANSFERS ──────────────────────────────────────────────────
    echo PHP_EOL . "[4] Posting Transfers..." . PHP_EOL;
    $transfers = Transfer::whereDate('transfer_date', '<=', $cutoff)->where('status', 'posted')->orderBy('transfer_date')->orderBy('id')->get();
    foreach ($transfers as $trf) {
        $fromBank = Bank::find($trf->from_bank_id);
        $toBank   = Bank::find($trf->to_bank_id);
        if (!$fromBank || !$toBank) continue;
        $adminFee = (float)$trf->admin_fee;
        $total    = (float)$trf->amount + $adminFee;
        $cashMovementService->createMovement($fromBank, Transfer::class, $trf->id, $trf->transfer_date, 0, $total, $trf->description);
        $cashMovementService->createMovement($toBank, Transfer::class, $trf->id, $trf->transfer_date, (float)$trf->amount, 0, $trf->description);
        $j = JournalEntry::create(['journal_number' => JournalEntry::generateJournalNumber(), 'journal_date' => $trf->transfer_date, 'description' => $trf->description, 'status' => 'posted', 'reference_type' => Transfer::class, 'reference_id' => $trf->id]);
        JournalEntryDetail::create(['journal_entry_id' => $j->id, 'chart_of_account_id' => $fromBank->chart_of_account_id, 'debit' => 0, 'credit' => $total, 'description' => 'Transfer Keluar']);
        JournalEntryDetail::create(['journal_entry_id' => $j->id, 'chart_of_account_id' => $toBank->chart_of_account_id, 'debit' => $trf->amount, 'credit' => 0, 'description' => 'Transfer Masuk']);
    }
    echo "  Done: " . $transfers->count() . " transfers." . PHP_EOL;

    // ── 5. MANUAL CASHOUT ─────────────────────────────────────────────
    echo PHP_EOL . "[5] Posting Manual CashOut..." . PHP_EOL;
    // First set all manual CashOut <= cutoff to posted
    CashOut::whereDate('cash_out_date', '<=', $cutoff)
        ->where(function($q) {
            $q->whereNull('reference_type')->orWhere('reference_type', 'Manual');
        })
        ->update(['status' => 'posted']);

    $manualCOs = CashOut::whereDate('cash_out_date', '<=', $cutoff)
        ->where('status', 'posted')
        ->where(function($q) { $q->whereNull('reference_type')->orWhere('reference_type', 'Manual'); })
        ->orderBy('cash_out_date')->orderBy('id')->get();

    $coCount = 0;
    foreach ($manualCOs as $co) {
        try {
            $journalService->postCashOut($co);
            $coCount++;
        } catch (\Exception $e) {
            echo "  ERROR {$co->cash_out_number}: " . $e->getMessage() . PHP_EOL;
        }
    }
    echo "  Done: {$coCount} manual cashouts." . PHP_EOL;

    // ── 6. OPENING BALANCE JOURNAL ────────────────────────────────────
    echo PHP_EOL . "[6] Creating Opening Balance Journal..." . PHP_EOL;
    $mahatoBank = Bank::where('name', 'like', '%Mahato%')->first();
    $modalCOA   = ChartOfAccount::where('code', '3100')->first();
    if ($mahatoBank && $modalCOA) {
        $j = JournalEntry::create(['journal_number' => JournalEntry::generateJournalNumber(), 'journal_date' => '2026-03-01', 'description' => 'Saldo Awal Kas Mahato (Opening Balance)', 'status' => 'posted', 'reference_type' => 'OpeningBalance', 'reference_id' => 1]);
        JournalEntryDetail::create(['journal_entry_id' => $j->id, 'chart_of_account_id' => $mahatoBank->chart_of_account_id, 'debit' => 13057822, 'credit' => 0, 'description' => 'Saldo Awal Kas Mahato']);
        JournalEntryDetail::create(['journal_entry_id' => $j->id, 'chart_of_account_id' => $modalCOA->id, 'debit' => 0, 'credit' => 13057822, 'description' => 'Lawan Saldo Awal (Modal 3100)']);
        echo "  Done." . PHP_EOL;
    }

    // ── 7. RECALCULATE BALANCES ───────────────────────────────────────
    echo PHP_EOL . "[7] Recalculating bank balances..." . PHP_EOL;
    CashMovementService::$skipRecalculate = false;
    foreach ($banks as $bank) {
        $cashMovementService->recalculateBalances($bank, '2020-01-01');
        echo "  {$bank->name}: Rp " . number_format($bank->balance) . PHP_EOL;
    }
});

echo PHP_EOL . "=== ALL DONE ===" . PHP_EOL;
