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

echo "=== CONFIRMING LOAN PAYMENTS (Opening Balance) ===" . PHP_EOL;

$payments = MemberLoanPayment::where('status', 'pending')
    ->whereHas('loan', function($q) {
        $q->where('is_opening_balance', true);
    })
    ->with('loan.member')
    ->get();

if ($payments->isEmpty()) {
    echo "No pending payments for opening balance loans found." . PHP_EOL;
    exit;
}

$journalService = app(JournalService::class);

try {
    DB::transaction(function () use ($payments, $journalService) {
        // Get Piutang Karyawan account (1202)
        $piutangAccount = ChartOfAccount::where('code', '1202')
            ->where('is_active', true)->first();

        if (!$piutangAccount) {
            throw new \Exception('Akun Piutang Karyawan (1202) tidak ditemukan.');
        }

        foreach ($payments as $payment) {
            echo "Processing Payment {$payment->payment_number} (Rp " . number_format($payment->amount) . ") for Loan {$payment->loan->loan_number}..." . PHP_EOL;

            // 1. Update Payment Status
            $payment->update([
                'status'     => 'confirmed',
                'updated_by' => 1, // System
            ]);

            // 2. Create CashIn if bank_id is present
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

                // 3. Post CashIn (Journal + Cash Movement)
                $journalService->postCashIn($cashIn);
                echo "  Confirmed via CashIn: {$cashIn->cash_in_number}" . PHP_EOL;
            } else {
                echo "  WARNING: Payment {$payment->payment_number} has no bank_id. Skipping journal posting." . PHP_EOL;
            }
        }
    });

    echo PHP_EOL . "=== ALL DONE ===" . PHP_EOL;
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
