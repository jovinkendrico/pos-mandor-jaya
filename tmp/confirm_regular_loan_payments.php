<?php

use App\Models\MemberLoanPayment;
use App\Models\ChartOfAccount;
use App\Models\CashIn;
use App\Services\JournalService;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== CONFIRMING PENDING LOAN PAYMENTS (Regular Loans) ===" . PHP_EOL;

$payments = MemberLoanPayment::where('status', 'pending')
    ->whereHas('loan', function($q) {
        $q->where('is_opening_balance', false);
    })
    ->with('loan.member')
    ->orderBy('payment_date')
    ->get();

if ($payments->isEmpty()) {
    echo "No pending payments found for regular loans." . PHP_EOL;
    exit;
}

echo "Found {$payments->count()} pending payments." . PHP_EOL;

$journalService = app(JournalService::class);
$piutangAccount = ChartOfAccount::where('code', '1202')->where('is_active', true)->first();

if (!$piutangAccount) {
    echo "ERROR: Akun Piutang Karyawan (1202) tidak ditemukan." . PHP_EOL;
    exit(1);
}

$success = 0;
$failed  = 0;

foreach ($payments as $payment) {
    try {
        DB::transaction(function () use ($payment, $piutangAccount, $journalService) {
            $payment->update(['status' => 'confirmed', 'updated_by' => 1]);

            if ($payment->bank_id) {
                $cashIn = CashIn::create([
                    'cash_in_number'      => CashIn::generateCashInNumber(),
                    'cash_in_date'        => $payment->payment_date,
                    'bank_id'             => $payment->bank_id,
                    'chart_of_account_id' => $piutangAccount->id,
                    'amount'              => $payment->amount,
                    'description'         => "Cicilan Pinjaman - {$payment->loan->member->name} #{$payment->payment_number}",
                    'status'              => 'posted',
                    'reference_type'      => 'MemberLoanPayment',
                    'reference_id'        => $payment->id,
                    'created_by'          => 1,
                    'updated_by'          => 1,
                ]);
                $journalService->postCashIn($cashIn);
                echo "  OK: {$payment->payment_number} ({$payment->loan->member->name}) Rp " . number_format($payment->amount) . " -> CashIn {$cashIn->cash_in_number}" . PHP_EOL;
            } else {
                echo "  SKIP: {$payment->payment_number} has no bank_id." . PHP_EOL;
            }
        });
        $success++;
    } catch (\Exception $e) {
        echo "  ERROR: {$payment->payment_number} - " . $e->getMessage() . PHP_EOL;
        $failed++;
    }
}

echo PHP_EOL . "=== DONE: {$success} confirmed, {$failed} failed ===" . PHP_EOL;
