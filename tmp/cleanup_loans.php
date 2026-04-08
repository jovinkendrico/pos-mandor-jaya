<?php

use App\Models\MemberLoan;
use App\Models\MemberLoanPayment;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\CashIn;
use App\Models\CashOut;
use App\Models\CashMovement;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$loanIds = [23, 24];

DB::transaction(function () use ($loanIds) {
    foreach ($loanIds as $loanId) {
        $loan = MemberLoan::find($loanId);
        if (!$loan) {
            echo "Loan ID $loanId not found. Skipping.\n";
            continue;
        }

        echo "Processing Loan ID $loanId (#{$loan->loan_number})...\n";

        // 1. Process Payments
        $payments = MemberLoanPayment::where('member_loan_id', $loanId)->get();
        foreach ($payments as $payment) {
            echo "  Deleting Payment ID {$payment->id} (#{$payment->payment_number})...\n";

            // Delete CashIn and CashMovement
            $cashIns = CashIn::where('reference_type', 'MemberLoanPayment')
                ->where('reference_id', $payment->id)
                ->get();
            foreach ($cashIns as $cashIn) {
                CashMovement::where('reference_type', 'CashIn')
                    ->where('reference_id', $cashIn->id)
                    ->delete();
                $cashIn->delete();
            }

            // Delete Journal Entries
            $journals = JournalEntry::where('reference_type', 'MemberLoanPayment')
                ->where('reference_id', $payment->id)
                ->get();
            foreach ($journals as $journal) {
                JournalEntryDetail::where('journal_entry_id', $journal->id)->delete();
                $journal->delete();
            }

            $payment->delete();
        }

        // 2. Process Loan related records
        echo "  Deleting Loan related records...\n";

        // Delete CashOut and CashMovement
        $cashOuts = CashOut::where('reference_type', 'MemberLoan')
            ->where('reference_id', $loanId)
            ->get();
        foreach ($cashOuts as $cashOut) {
            CashMovement::where('reference_type', 'CashOut')
                ->where('reference_id', $cashOut->id)
                ->delete();
            $cashOut->delete();
        }

        // Fallback for direct CashMovement (old data)
        CashMovement::where('reference_type', 'MemberLoan')
            ->where('reference_id', $loanId)
            ->delete();

        // Delete Journal Entries
        $journals = JournalEntry::where('reference_type', 'MemberLoan')
            ->where('reference_id', $loanId)
            ->get();
        foreach ($journals as $journal) {
            JournalEntryDetail::where('journal_entry_id', $journal->id)->delete();
            $journal->delete();
        }

        // 3. Delete Loan itself
        $loan->delete();
        echo "Loan ID $loanId deleted successfully.\n";
    }
});

echo "Cleanup completed.\n";
