<?php

use App\Models\Bank;
use App\Models\CashOut;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\CashMovement;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    echo "Restoring state...\n";

    // 1. Restore CashOut CO2026040100001 (ID 160)
    $cashOut = CashOut::withTrashed()->where('cash_out_number', 'CO2026040100001')->first();
    if ($cashOut) {
        $cashOut->restore();
        echo "Restored CashOut CO2026040100001.\n";
    }

    // 2. Re-create Journal Entry JRN-20260409-00042 (ID 1025)
    // First, try to restore if it was soft deleted
    $journal = JournalEntry::withTrashed()->where('journal_number', 'JRN-20260409-00042')->first();
    if ($journal) {
        $journal->restore();
        echo "Restored Journal Entry JRN-20260409-00042.\n";
        
        // Re-create details (they were hard deleted)
        $journal->details()->delete(); // Clean up if any orphans
        
        JournalEntryDetail::create([
            'journal_entry_id' => $journal->id,
            'chart_of_account_id' => 13, // Piutang Usaha
            'debit' => 103000000,
            'credit' => 0,
            'description' => 'Transfer Ke Rek Mandiri Eniss (Ref: TRF-20260401-00001)',
        ]);
        
        JournalEntryDetail::create([
            'journal_entry_id' => $journal->id,
            'chart_of_account_id' => 3, // Kas Mahato
            'debit' => 0,
            'credit' => 103000000,
            'description' => 'Transfer Ke Rek Mandiri Eniss (Ref: TRF-20260401-00001)',
        ]);
        echo "Re-created Journal Details.\n";
    }

    // 3. Re-create CashMovement (ID 2045 equivalent)
    // Check if it already exists to avoid duplication
    $existingM = CashMovement::where('reference_type', 'CashOut')
        ->where('reference_id', 160)
        ->first();
    
    if (!$existingM) {
        CashMovement::create([
            'bank_id' => 3,
            'reference_type' => 'CashOut',
            'reference_id' => 160,
            'movement_date' => '2026-04-01',
            'debit' => 0,
            'credit' => 103000000,
            'balance' => -26922241, // Re-storing the legacy balance we saw earlier
            'description' => 'Kas Keluar #CO2026040100001: Transfer Ke Rek Mandiri Eniss (Ref: TRF-20260401-00001)',
        ]);
        echo "Re-created CashMovement for 103M.\n";
    }

    // 4. Force Reset Bank Balances based on Verified Screenshot
    $mahatoBank = Bank::find(3);
    if ($mahatoBank) {
        $mahatoBank->update(['balance' => 16154826]);
        echo "Set Kas Mahato Balance: 16,154,826.\n";
    }

    // Note: User will handle Kas Medan and Clearing manual or I can set them if I find their IDs
    // For now, let's just fix Mahato which was the main issue.

    echo "Restoration complete.\n";
});
