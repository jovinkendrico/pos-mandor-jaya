<?php
use App\Models\MemberLoanPayment;
use App\Models\CashIn;
use App\Models\JournalEntry;
use App\Services\JournalService;
use Illuminate\Support\Facades\DB;

$payment = MemberLoanPayment::find(30);

if ($payment) {
    if ($payment->status === 'confirmed') {
        DB::transaction(function () use ($payment) {
            // Find and reverse cash in
            $cashIn = CashIn::where('reference_type', 'MemberLoanPayment')
                ->where('reference_id', $payment->id)
                ->where('status', 'posted')->first();

            if ($cashIn) {
                app(JournalService::class)->reverseCashIn($cashIn);
                $cashIn->delete();
            } else {
                // Reverse manual journal entries
                JournalEntry::where('reference_type', 'MemberLoanPayment')
                    ->where('reference_id', $payment->id)
                    ->where('status', 'posted')
                    ->update(['status' => 'reversed']);
            }

            $payment->update([
                'status'     => 'pending',
                'updated_by' => 1, // Fallback to 1
            ]);
        });
        echo "Payment unconfirmed.\n";
    }

    $payment->delete();
    echo "Payment BP30 deleted successfully.\n";
} else {
    echo "Payment BP30 not found.\n";
}
