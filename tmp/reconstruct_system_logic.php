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

echo "--- STARTING TOTAL SYSTEM RECONSTRUCTION (NATIVE LOGIC) ---" . PHP_EOL;

// 0. ENSURE CORE ACCOUNTS EXIST
echo "Ensuring core accounts exist (2105, 4999)..." . PHP_EOL;
$utangLain = ChartOfAccount::firstOrCreate(
    ['code' => '2105'],
    ['name' => 'Utang Lain-lain', 'type' => 'liability', 'is_active' => true]
);
$selisihRound = ChartOfAccount::firstOrCreate(
    ['code' => '4999'],
    ['name' => 'Selisih Pembulatan', 'type' => 'income', 'is_active' => true]
);
echo "  Core accounts verified." . PHP_EOL;

// 1. NUCLEAR WIPE (CLEAN SLATE)
echo "Wiping accounting documents and auto-generated cash records..." . PHP_EOL;
DB::table('journal_entry_details')->delete();
DB::table('journal_entries')->delete();
DB::table('cash_movements')->delete();
// Only delete cash records linked to modules, keep manual ones (where ref is null or specific)
DB::table('cash_ins')->whereNotNull('reference_type')->delete();
DB::table('cash_outs')->whereNotNull('reference_type')->delete();

// 2. MASS UNPOST (SET TO PENDING/DRAFT)
echo "Resetting statuses for March transactions..." . PHP_EOL;
Sale::whereDate('sale_date', '<=', $cutoff)->update(['status' => 'pending']);
SalePayment::whereDate('payment_date', '<=', $cutoff)->update(['status' => 'pending']);
MemberLoan::whereDate('loan_date', '<=', $cutoff)->update(['status' => 'pending']);
MemberLoanPayment::whereDate('payment_date', '<=', $cutoff)->update(['status' => 'pending']);

// 3. RESET BANK BALANCES TO INITIAL
echo "Resetting bank balances..." . PHP_EOL;
Bank::where('name', 'like', '%Medan%')->update(['initial_balance' => 0]);
Bank::where('name', 'like', '%Mahato%')->update(['initial_balance' => 13057822]);
$banks = Bank::all();
foreach ($banks as $bank) { 
    $bank->update(['balance' => $bank->initial_balance]); 
    echo "  {$bank->name}: Init = {$bank->initial_balance}" . PHP_EOL;
}

$stockService = app(StockService::class);
$journalService = app(JournalService::class);
$cashMovementService = app(CashMovementService::class);

// Performance optimization
\App\Services\CashMovementService::$skipRecalculate = true;

DB::transaction(function() use ($cutoff, $stockService, $journalService, $cashMovementService, $banks) {

    // 4. RE-POST SALES (STOCKS)
    echo "Processing Sales (Native Stock Integration)..." . PHP_EOL;
    $sales = Sale::whereDate('sale_date', '<=', $cutoff)->orderBy('sale_date')->orderBy('id')->get();
    foreach ($sales as $sale) {
        $stockService->confirmSale($sale);
    }
    echo "  Synced " . $sales->count() . " Sales." . PHP_EOL;

    // 5. RE-POST SALE PAYMENTS (CASH & JOURNALS)
    echo "Processing Sale Payments (Native Cash Integration)..." . PHP_EOL;
    $payments = SalePayment::whereDate('payment_date', '<=', $cutoff)->orderBy('payment_date')->orderBy('id')->get();
    foreach ($payments as $sp) {
        // NATIVE LOGIC FROM SalePaymentController@confirm
        $overpaymentAmount = $sp->calculateOverpayment();
        $sp->update(['status' => 'confirmed', 'overpayment_amount' => $overpaymentAmount, 'overpayment_status' => $overpaymentAmount > 0 ? 'pending' : 'none']);
        
        if ($sp->bank_id) {
            $receivableAccount = ChartOfAccount::where('code', '1201')->first();
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

            // Reclassify overpayment to Utang Lain-lain (2105)
            if ($overpaymentAmount > 0) {
                $otherPayableAccount = ChartOfAccount::where('code', '2105')->first();
                if ($otherPayableAccount) {
                    $journal = JournalEntry::create([
                        'journal_number' => JournalEntry::generateJournalNumber(),
                        'journal_date' => $sp->payment_date,
                        'reference_type' => 'SalePayment', // Or Overpayment Adjustment
                        'reference_id' => $sp->id,
                        'description' => "Penyesuaian Kelebihan Bayar #{$sp->payment_number}",
                        'status' => 'posted',
                    ]);
                    // Dr. Piutang Usaha (reverse the excess credit)
                    JournalEntryDetail::create(['journal_entry_id' => $journal->id, 'chart_of_account_id' => $receivableAccount->id, 'debit' => $overpaymentAmount, 'credit' => 0, 'description' => 'Penyesuaian piutang (Kelebihan Bayar)']);
                    // Cr. Utang Lain-lain (liability)
                    JournalEntryDetail::create(['journal_entry_id' => $journal->id, 'chart_of_account_id' => $otherPayableAccount->id, 'debit' => 0, 'credit' => $overpaymentAmount, 'description' => 'Titipan kelebihan bayar']);
                }
            }
        }
    }
    echo "  Synced " . $payments->count() . " Sale Payments." . PHP_EOL;

    // 6. RE-POST LOANS
    echo "Processing Member Loans..." . PHP_EOL;
    $loans = MemberLoan::whereDate('loan_date', '<=', $cutoff)->orderBy('loan_date')->orderBy('id')->get();
    foreach ($loans as $loan) {
        if (!$loan->is_opening_balance) {
            $loan->update(['status' => 'confirmed']);
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
    
    // 7. RE-POST TRANSFERS
    echo "Processing Transfers..." . PHP_EOL;
    $transfers = Transfer::whereDate('transfer_date', '<=', $cutoff)
        ->where('status', 'posted') // Keep only those that were already posted
        ->orderBy('transfer_date')->orderBy('id')->get();
    foreach ($transfers as $trf) {
        $fromBank = Bank::find($trf->from_bank_id);
        $toBank = Bank::find($trf->to_bank_id);
        $adminFee = (float)$trf->admin_fee;
        $totalSourceAmount = (float)$trf->amount + $adminFee;
        $cashMovementService->createMovement($fromBank, Transfer::class, $trf->id, $trf->transfer_date, 0, $totalSourceAmount, $trf->description);
        $cashMovementService->createMovement($toBank, Transfer::class, $trf->id, $trf->transfer_date, (float)$trf->amount, 0, $trf->description);
        $journal = JournalEntry::create([
            'journal_number' => JournalEntry::generateJournalNumber(),
            'journal_date'   => $trf->transfer_date,
            'description'    => $trf->description,
            'status'         => 'posted',
            'reference_type' => Transfer::class,
            'reference_id'   => $trf->id,
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

    // 8. FINAL RECALCULATION
    echo "Finalizing bank balances..." . PHP_EOL;
    \App\Services\CashMovementService::$skipRecalculate = false;
    foreach ($banks as $bank) {
        $cashMovementService->recalculateBalances($bank, '2020-01-01');
        echo "  {$bank->name} Final: {$bank->balance}" . PHP_EOL;
    }

    // 9. OPENING BALANCE JOURNAL
    echo "Creating Opening Balance Journal (13M)..." . PHP_EOL;
    $je = JournalEntry::create([
        'journal_number' => JournalEntry::generateJournalNumber(),
        'journal_date' => '2026-03-01',
        'description' => 'Saldo Awal Kas Mahato (Opening Balance)',
        'status' => 'posted',
        'reference_type' => 'OpeningBalance',
        'reference_id' => 1,
    ]);
    JournalEntryDetail::create(['journal_entry_id' => $je->id, 'chart_of_account_id' => 2, 'debit' => 13057822, 'credit' => 0, 'description' => 'Saldo Awal Kas Mahato']); // Kas Mahato
    JournalEntryDetail::create(['journal_entry_id' => $je->id, 'chart_of_account_id' => 78, 'debit' => 0, 'credit' => 13057822, 'description' => 'Lawan Saldo Awal (Modal)']); // Modal
});

echo "--- RECONSTRUCTION COMPLETED ---" . PHP_EOL;
