<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\MemberLoanPayment;
use App\Models\CashIn;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\CashMovement;
use App\Services\JournalService;

DB::beginTransaction();
try {
    $payments = MemberLoanPayment::whereIn('id', [10, 24])->where('status', 'confirmed')->get();
    
    foreach ($payments as $payment) {
        echo "Unconfirming MemberLoanPayment #{$payment->id} ({$payment->amount})...\n";
        
        // 1. Delete associated CashIn
        $cashIn = CashIn::where('reference_type', 'MemberLoanPayment')
                        ->where('reference_id', $payment->id)
                        ->first();
                        
        if ($cashIn) {
            echo "- Found CashIn #{$cashIn->cash_in_number}\n";
            // Delete its CashMovements
            CashMovement::where('reference_type', 'CashIn')
                        ->where('reference_id', $cashIn->id)
                        ->delete();
            echo "- Deleted CashIn's CashMovements\n";
            
            // Delete its JournalEntry
            $je = JournalEntry::where('reference_type', 'CashIn')->where('reference_id', $cashIn->id)->first();
            if ($je) {
                JournalEntryDetail::where('journal_entry_id', $je->id)->delete();
                $je->delete();
                echo "- Deleted CashIn's JournalEntry #{$je->journal_number}\n";
            }
            
            // Delete CashIn
            $cashIn->delete();
            echo "- Deleted CashIn record\n";
        }
        
        // Sometimes the journal is posted directly from MemberLoanPayment
        $jeDirect = JournalEntry::where('reference_type', 'MemberLoanPayment')->where('reference_id', $payment->id)->first();
        if ($jeDirect) {
            JournalEntryDetail::where('journal_entry_id', $jeDirect->id)->delete();
            $jeDirect->delete();
            echo "- Deleted Direct JournalEntry #{$jeDirect->journal_number}\n";
        }

        CashMovement::where('reference_type', 'MemberLoanPayment')->where('reference_id', $payment->id)->delete();
        
        // Set payment to pending
        $payment->status = 'pending';
        $payment->save();
        echo "- Set MemberLoanPayment #{$payment->id} to pending\n";

        // Update Loan remaining_balance by adding back this amount
        $loan = $payment->loan;
        $loan->remaining_balance = $loan->remaining_balance + $payment->amount;
        $loan->save();
        echo "- Restored Loan #{$loan->loan_number} remaining balance.\n";
    }

    echo "Recalculating balances for Bank ID 1...\n";
    $movements = CashMovement::where('bank_id', 1)
        ->orderBy('movement_date', 'asc')
        ->orderBy('id', 'asc')
        ->get();

    $runningBalance = 0; 
    foreach ($movements as $movement) {
        $runningBalance = round($runningBalance + $movement->debit - $movement->credit, 2);
        DB::table('cash_movements')
            ->where('id', $movement->id)
            ->update(['balance' => $runningBalance]);
    }
    
    // Set bank initial balance to 0 just in case
    DB::table('banks')->where('id', 1)->update(['initial_balance' => 0]);
    CashMovement::where('bank_id', 1)->where('debit', 99900000)->where('reference_type', 'Bank')->delete();

    echo "New Ending Balance for Bank ID 1: " . number_format($runningBalance, 2) . "\n";
    DB::commit();
    echo "Done.\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
