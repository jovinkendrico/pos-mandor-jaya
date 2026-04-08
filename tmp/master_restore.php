<?php

use App\Models\CashOut;
use App\Models\CashIn;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\MemberLoan;
use App\Models\Transfer;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    echo "=== THE GRAND RESTORATION ===\n";

    // 1. Restore all CashOut Journals (for valid ones)
    $cashOuts = CashOut::whereIn('status', ['posted', 'confirmed'])->get();
    $coCreated = 0;
    foreach ($cashOuts as $co) {
        $je = JournalEntry::where('reference_type', 'CashOut')->where('reference_id', $co->id)->first();
        if (!$je) {
            $je = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => $co->cash_out_date,
                'reference_type' => 'CashOut',
                'reference_id'   => $co->id,
                'description'    => "Kas Keluar #{$co->cash_out_number}: " . ($co->description ?? ''),
                'status'         => 'posted',
            ]);
            
            // Debit Request
            if ($co->chart_of_account_id) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $je->id,
                    'chart_of_account_id' => $co->chart_of_account_id,
                    'debit'               => $co->amount,
                    'credit'              => 0,
                    'description'         => "Kas Keluar #{$co->cash_out_number}",
                    'vehicle_id'          => $co->vehicle_id,
                ]);
            }
            
            // Credit Bank
            $bankClass = class_exists('\App\Models\Bank') ? \App\Models\Bank::class : \App\Models\Master\Bank::class;
            $bank = $bankClass::find($co->bank_id);
            if ($bank && $bank->chart_of_account_id) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $je->id,
                    'chart_of_account_id' => $bank->chart_of_account_id,
                    'debit'               => 0,
                    'credit'              => $co->amount,
                    'description'         => "Kas Keluar #{$co->cash_out_number}",
                ]);
            }
            $coCreated++;
        }
    }
    echo "Restored $coCreated valid CashOut Journals.\n";

    // 2. Restore all CashIn Journals
    $cashIns = CashIn::whereIn('status', ['posted', 'confirmed'])->get();
    $ciCreated = 0;
    foreach ($cashIns as $ci) {
        $je = JournalEntry::where('reference_type', 'CashIn')->where('reference_id', $ci->id)->first();
        if (!$je) {
            $je = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => $ci->cash_in_date,
                'reference_type' => 'CashIn',
                'reference_id'   => $ci->id,
                'description'    => "Kas Masuk #{$ci->cash_in_number}: " . ($ci->description ?? ''),
                'status'         => 'posted',
            ]);
            
            $bankClass = class_exists('\App\Models\Bank') ? \App\Models\Bank::class : \App\Models\Master\Bank::class;
            $bank = $bankClass::find($ci->bank_id);
            if ($bank && $bank->chart_of_account_id) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $je->id,
                    'chart_of_account_id' => $bank->chart_of_account_id,
                    'debit'               => $ci->amount,
                    'credit'              => 0,
                    'description'         => "Kas Masuk #{$ci->cash_in_number}",
                ]);
            }
            
            if ($ci->chart_of_account_id) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $je->id,
                    'chart_of_account_id' => $ci->chart_of_account_id,
                    'debit'               => 0,
                    'credit'              => $ci->amount,
                    'description'         => "Kas Masuk #{$ci->cash_in_number}",
                ]);
            }
            $ciCreated++;
        }
    }
    echo "Restored $ciCreated valid CashIn Journals.\n";

    // 3. Address missing Bank Credits for other modules due to perfect_sync bug
    // Since perfect_sync touched COA = 2 (Kas Mahato) only, we just reconstruct missing COA 2 entries
    $bankMahato = \App\Models\Bank::find(1);
    $coa2 = $bankMahato->chart_of_account_id ?? 2;
    $missingCount = 0;

    // For Transfers (Reference type Transfer / App\Models\Transfer)
    $jes = JournalEntry::where('reference_type', 'like', '%Transfer')->get();
    foreach ($jes as $je) {
        $hasBank1 = JournalEntryDetail::where('journal_entry_id', $je->id)->where('chart_of_account_id', $coa2)->exists();
        if (!$hasBank1) {
            $transfer = Transfer::withTrashed()->find($je->reference_id);
            if ($transfer && !$transfer->trashed()) {
                // If it came FROM bank 1, Bank 1 should be credited
                if ($transfer->from_bank_id == 1) {
                    JournalEntryDetail::create(['journal_entry_id' => $je->id, 'chart_of_account_id' => $coa2, 'debit' => 0, 'credit' => $transfer->amount, 'description' => 'Transfer Keluar']);
                    $missingCount++;
                }
                // If it went TO bank 1, Bank 1 should be debited
                if ($transfer->to_bank_id == 1) {
                    JournalEntryDetail::create(['journal_entry_id' => $je->id, 'chart_of_account_id' => $coa2, 'debit' => $transfer->amount, 'credit' => 0, 'description' => 'Transfer Masuk']);
                    $missingCount++;
                }
            }
        }
    }

    // For MemberLoans (Reference type MemberLoan)
    $jes = JournalEntry::where('reference_type', 'like', '%MemberLoan')->get();
    foreach ($jes as $je) {
        // Wait, MemberLoan uses Bank 1 as credit as well.
        $hasBank1 = JournalEntryDetail::where('journal_entry_id', $je->id)->where('chart_of_account_id', $coa2)->exists();
        if (!$hasBank1) {
            $loan = MemberLoan::withTrashed()->find($je->reference_id);
            if ($loan && !$loan->trashed() && $loan->bank_id == 1) {
                JournalEntryDetail::create(['journal_entry_id' => $je->id, 'chart_of_account_id' => $coa2, 'debit' => 0, 'credit' => $loan->amount, 'description' => 'Pinjaman Anggota']);
                $missingCount++;
            }
        }
    }

    echo "Restored $missingCount missing Bank legs for Transfers/MemberLoans.\n";

    // 4. Verify Final Global Balance
    $d = JournalEntryDetail::sum('debit');
    $c = JournalEntryDetail::sum('credit');
    echo "Global JE Diff (Debit - Credit): " . ($d - $c) . "\n";

    // 5. Verify Kas Mahato Balance
    $d2 = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')->where('journal_entries.status', 'posted')->where('chart_of_account_id', $coa2)->sum('debit');
    $c2 = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')->where('journal_entries.status', 'posted')->where('chart_of_account_id', $coa2)->sum('credit');
    $jeNet2 = $d2 - $c2;
    echo "Kas Mahato Bank Balance: " . $bankMahato->balance . "\n";
    echo "Kas Mahato Journal Net: " . $jeNet2 . "\n";
    echo "Kas Mahato Diff: " . ($bankMahato->balance - $jeNet2) . "\n";
});
