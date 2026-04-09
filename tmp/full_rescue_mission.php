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
$aprilStart = '2026-04-01';

echo "--- STARTING THE GRAND RESCUE MISSION ---" . PHP_EOL;

// 1. RECOVERY FROM LOGS
echo "Recovering CashIn and CashOut records from activity_logs..." . PHP_EOL;

$restoreModels = ['App\Models\CashIn' => 'cash_ins', 'App\Models\CashOut' => 'cash_outs'];
foreach ($restoreModels as $modelClass => $table) {
    $logs = DB::table('activity_logs')
        ->where('action', 'created')
        ->where('model_type', $modelClass)
        ->get();
        
    $restoredCount = 0;
    foreach ($logs as $log) {
        $data = json_decode($log->old_values ?: $log->new_values, true);
        if ($data) {
            // Check if record exists
            if (!DB::table($table)->where('id', $data['id'])->exists()) {
                // Ensure all fields are present or nullable
                DB::table($table)->insert($data);
                $restoredCount++;
            }
        }
    }
    echo "  Restored $restoredCount records to $table." . PHP_EOL;
}

// 2. APRIL HARD RESET (DRAFT)
echo "Setting all April transactions to Draft/Pending..." . PHP_EOL;
\App\Models\Sale::whereDate('sale_date', '>=', $aprilStart)->update(['status' => 'draft']);
\App\Models\Purchase::whereDate('purchase_date', '>=', $aprilStart)->update(['status' => 'draft']);
\App\Models\SalePayment::whereDate('payment_date', '>=', $aprilStart)->update(['status' => 'pending']);
\App\Models\MemberLoan::whereDate('loan_date', '>=', $aprilStart)->update(['status' => 'pending']);
\App\Models\MemberLoanPayment::whereDate('payment_date', '>=', $aprilStart)->update(['status' => 'pending']);
\App\Models\Transfer::whereDate('transfer_date', '>=', $aprilStart)->update(['status' => 'pending']);
\App\Models\CashIn::whereDate('cash_in_date', '>=', $aprilStart)->update(['status' => 'cancelled']);
\App\Models\CashOut::whereDate('cash_out_date', '>=', $aprilStart)->update(['status' => 'draft']);

// 3. WIPE ALL ACCOUNTING
echo "Clearing all journals and movements..." . PHP_EOL;
DB::table('journal_entry_details')->delete();
DB::table('journal_entries')->delete();
DB::table('cash_movements')->delete();

// 4. RESET BANK BALANCES TO INITIAL
echo "Resetting bank balances..." . PHP_EOL;
Bank::where('name', 'like', '%Medan%')->update(['initial_balance' => 0]);
Bank::where('name', 'like', '%Mahato%')->update(['initial_balance' => 13057822]);
$banks = Bank::all();
foreach ($banks as $bank) { $bank->update(['balance' => $bank->initial_balance]); }

// 5. MASTER SYNC (ONLY MARCH AND EARLIER)
echo "Re-posting valid March transactions..." . PHP_EOL;
$journalService = app(JournalService::class);
$cashMovementService = app(CashMovementService::class);
\App\Services\CashMovementService::$skipRecalculate = true;

DB::transaction(function() use ($cutoff, $journalService, $cashMovementService, $banks) {
    // CASH IN (Posted)
    $cashIns = CashIn::whereDate('cash_in_date', '<=', $cutoff)->where('status', 'posted')->orderBy('cash_in_date')->orderBy('id')->get();
    foreach ($cashIns as $ci) {
        $journalService->postCashIn($ci);
    }
    echo "  Synced CashIn (" . $cashIns->count() . " records)." . PHP_EOL;

    // CASH OUT (Posted)
    $cashOuts = CashOut::whereDate('cash_out_date', '<=', $cutoff)->where('status', 'posted')->orderBy('cash_out_date')->orderBy('id')->get();
    foreach ($cashOuts as $co) {
        $journalService->postCashOut($co);
    }
    echo "  Synced CashOut (" . $cashOuts->count() . " records)." . PHP_EOL;

    // TRANSFER (Posted)
    $transfers = Transfer::whereDate('transfer_date', '<=', $cutoff)->where('status', 'posted')->orderBy('transfer_date')->orderBy('id')->get();
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
    echo "  Synced Transfer (" . $transfers->count() . " records)." . PHP_EOL;

    // 6. FINAL RECALCULATION
    echo "Finalizing bank balances..." . PHP_EOL;
    \App\Services\CashMovementService::$skipRecalculate = false;
    foreach ($banks as $bank) {
        $cashMovementService->recalculateBalances($bank, '2020-01-01');
        echo "  {$bank->name} Final: {$bank->balance}" . PHP_EOL;
    }
});

echo "--- RESCUE MISSION COMPLETED ---" . PHP_EOL;
