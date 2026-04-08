<?php

use Illuminate\Support\Facades\DB;
use App\Models\JournalEntry;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    echo "=== FAST REPAIR ===\n";
    $date = now()->format('Y-m-d H:i:s');

    // 1. Missing CashOut Journals
    $missingCOs = DB::select("
        SELECT co.*, b.chart_of_account_id as bank_coa
        FROM cash_outs co
        LEFT JOIN journal_entries je ON je.reference_type = 'CashOut' AND je.reference_id = co.id
        LEFT JOIN banks b ON co.bank_id = b.id
        WHERE je.id IS NULL AND co.status IN ('posted', 'confirmed') AND co.deleted_at IS NULL AND co.reference_type IS NULL
    ");
    
    foreach ($missingCOs as $co) {
        $jeId = DB::table('journal_entries')->insertGetId([
            'journal_number' => JournalEntry::generateJournalNumber(),
            'journal_date'   => $co->cash_out_date,
            'reference_type' => 'CashOut',
            'reference_id'   => $co->id,
            'description'    => "Kas Keluar #" . $co->cash_out_number . ": " . $co->description,
            'status'         => 'posted',
            'created_at'     => $date,
            'updated_at'     => $date,
        ]);
        
        if ($co->chart_of_account_id) {
            DB::table('journal_entry_details')->insert([
                'journal_entry_id'    => $jeId,
                'chart_of_account_id' => $co->chart_of_account_id,
                'debit'               => $co->amount,
                'credit'              => 0,
                'description'         => "Kas Keluar #" . $co->cash_out_number,
                'vehicle_id'          => $co->vehicle_id,
            ]);
        }
        
        if ($co->bank_coa) {
            DB::table('journal_entry_details')->insert([
                'journal_entry_id'    => $jeId,
                'chart_of_account_id' => $co->bank_coa,
                'debit'               => 0,
                'credit'              => $co->amount,
                'description'         => "Kas Keluar #" . $co->cash_out_number,
            ]);
        }
    }
    echo "Restored " . count($missingCOs) . " CashOut Journals.\n";

    // 2. Missing CashIn Journals
    $missingCIs = DB::select("
        SELECT ci.*, b.chart_of_account_id as bank_coa
        FROM cash_ins ci
        LEFT JOIN journal_entries je ON je.reference_type = 'CashIn' AND je.reference_id = ci.id
        LEFT JOIN banks b ON ci.bank_id = b.id
        WHERE je.id IS NULL AND ci.status IN ('posted', 'confirmed') AND ci.deleted_at IS NULL AND ci.reference_type IS NULL
    ");
    
    foreach ($missingCIs as $ci) {
        $jeId = DB::table('journal_entries')->insertGetId([
            'journal_number' => JournalEntry::generateJournalNumber(),
            'journal_date'   => $ci->cash_in_date,
            'reference_type' => 'CashIn',
            'reference_id'   => $ci->id,
            'description'    => "Kas Masuk #" . $ci->cash_in_number . ": " . $ci->description,
            'status'         => 'posted',
            'created_at'     => $date,
            'updated_at'     => $date,
        ]);
        
        if ($ci->bank_coa) {
            DB::table('journal_entry_details')->insert([
                'journal_entry_id'    => $jeId,
                'chart_of_account_id' => $ci->bank_coa,
                'debit'               => $ci->amount,
                'credit'              => 0,
                'description'         => "Kas Masuk #" . $ci->cash_in_number,
            ]);
        }
        
        if ($ci->chart_of_account_id) {
            DB::table('journal_entry_details')->insert([
                'journal_entry_id'    => $jeId,
                'chart_of_account_id' => $ci->chart_of_account_id,
                'debit'               => 0,
                'credit'              => $ci->amount,
                'description'         => "Kas Masuk #" . $ci->cash_in_number,
            ]);
        }
    }
    echo "Restored " . count($missingCIs) . " CashIn Journals.\n";

    // 3. Address missing Bank Credits for Transfers/MemberLoans
    $bankMahato = DB::table('banks')->where('id', 1)->first();
    $coa2 = $bankMahato->chart_of_account_id ?? 2;

    // Transfers
    $transfers = DB::select("
        SELECT t.id, t.amount, t.from_bank_id, t.to_bank_id, je.id as je_id
        FROM transfers t
        JOIN journal_entries je ON je.reference_type LIKE '%Transfer' AND je.reference_id = t.id
        WHERE t.deleted_at IS NULL
    ");
    
    $restoredTransfers = 0;
    foreach ($transfers as $t) {
        $hasBank1 = DB::table('journal_entry_details')->where('journal_entry_id', $t->je_id)->where('chart_of_account_id', $coa2)->exists();
        if (!$hasBank1) {
            if ($t->from_bank_id == 1) {
                DB::table('journal_entry_details')->insert(['journal_entry_id' => $t->je_id, 'chart_of_account_id' => $coa2, 'debit' => 0, 'credit' => $t->amount, 'description' => 'Transfer Keluar']);
                $restoredTransfers++;
            }
            if ($t->to_bank_id == 1) {
                DB::table('journal_entry_details')->insert(['journal_entry_id' => $t->je_id, 'chart_of_account_id' => $coa2, 'debit' => $t->amount, 'credit' => 0, 'description' => 'Transfer Masuk']);
                $restoredTransfers++;
            }
        }
    }

    // MemberLoans
    $memberLoans = DB::select("
        SELECT ml.id, ml.amount, ml.bank_id, je.id as je_id
        FROM member_loans ml
        JOIN journal_entries je ON je.reference_type LIKE '%MemberLoan' AND je.reference_id = ml.id
        WHERE ml.deleted_at IS NULL AND ml.bank_id = 1
    ");
    
    $restoredLoans = 0;
    foreach ($memberLoans as $ml) {
        $hasBank1 = DB::table('journal_entry_details')->where('journal_entry_id', $ml->je_id)->where('chart_of_account_id', $coa2)->exists();
        if (!$hasBank1) {
            DB::table('journal_entry_details')->insert(['journal_entry_id' => $ml->je_id, 'chart_of_account_id' => $coa2, 'debit' => 0, 'credit' => $ml->amount, 'description' => 'Pinjaman Anggota']);
            $restoredLoans++;
        }
    }
    echo "Restored $restoredTransfers Transfer legs and $restoredLoans MemberLoan legs.\n";
    

    // Validate global diff
    $d = DB::table('journal_entry_details')->sum('debit');
    $c = DB::table('journal_entry_details')->sum('credit');
    echo "Global JE Diff (Debit - Credit): " . ($d - $c) . "\n";

    // Validate Kas Mahato Diff
    $d2 = DB::table('journal_entry_details')
        ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.status', 'posted')
        ->where('chart_of_account_id', $coa2)
        ->sum('debit');
        
    $c2 = DB::table('journal_entry_details')
        ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.status', 'posted')
        ->where('chart_of_account_id', $coa2)
        ->sum('credit');
        
    $jeNet2 = $d2 - $c2;
    echo "Kas Mahato Bank Balance: " . $bankMahato->balance . "\n";
    echo "Kas Mahato Journal Net: " . $jeNet2 . "\n";
    echo "Kas Mahato Diff: " . ($bankMahato->balance - $jeNet2) . "\n";
});
