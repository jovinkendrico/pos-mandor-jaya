<?php

use Illuminate\Support\Facades\DB;
use App\Models\JournalEntry;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    echo "=== BULLETPROOF REPAIR ===\n";
    $date = now()->format('Y-m-d H:i:s');

    $bank1 = DB::table('banks')->where('id', 1)->first();
    $coa2 = $bank1->chart_of_account_id ?? 2;

    // 1. CLEAR existing CashIn / CashOut Journals entirely (only Manual ones so we can cleanly rebuild)
    $manualCI = DB::table('cash_ins')->whereNull('deleted_at')->where(function($q){ $q->whereNull('reference_type')->orWhere('reference_type', 'Manual'); })->pluck('id');
    $manualCO = DB::table('cash_outs')->whereNull('deleted_at')->where(function($q){ $q->whereNull('reference_type')->orWhere('reference_type', 'Manual'); })->pluck('id');
    
    $jesToDelete = DB::table('journal_entries')
        ->where(function($q) use ($manualCI) { $q->where('reference_type', 'CashIn')->whereIn('reference_id', $manualCI); })
        ->orWhere(function($q) use ($manualCO) { $q->where('reference_type', 'CashOut')->whereIn('reference_id', $manualCO); })
        ->pluck('id');
        
    if ($jesToDelete->count() > 0) {
        DB::table('journal_entry_details')->whereIn('journal_entry_id', $jesToDelete)->delete();
        DB::table('journal_entries')->whereIn('id', $jesToDelete)->delete();
    }
    echo "Cleared " . $jesToDelete->count() . " old manual journals for safe rebuild.\n";

    // 2. CLEAR all Kas Mahato legs for Transfer and MemberLoan to fix duplication
    $derivedJes = DB::table('journal_entries')
        ->where('reference_type', 'like', '%Transfer')
        ->orWhere('reference_type', 'like', '%MemberLoan')
        ->orWhere('reference_type', 'like', '%PurchasePayment')
        ->pluck('id');
        
    DB::table('journal_entry_details')
        ->whereIn('journal_entry_id', $derivedJes)
        ->where('chart_of_account_id', $coa2)
        ->delete();
    echo "Cleared old derived Kas Mahato legs to prevent duplication.\n";

    // 3. Rebuild CashOut Journals
    $missingCOs = DB::select("
        SELECT co.*, b.chart_of_account_id as bank_coa
        FROM cash_outs co
        LEFT JOIN banks b ON co.bank_id = b.id
        WHERE co.status IN ('posted', 'confirmed') AND co.deleted_at IS NULL AND (co.reference_type IS NULL OR co.reference_type = 'Manual')
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
    echo "Built " . count($missingCOs) . " CashOut Journals.\n";

    // 4. Rebuild CashIn Journals
    $missingCIs = DB::select("
        SELECT ci.*, b.chart_of_account_id as bank_coa
        FROM cash_ins ci
        LEFT JOIN banks b ON ci.bank_id = b.id
        WHERE ci.status IN ('posted', 'confirmed') AND ci.deleted_at IS NULL AND (ci.reference_type IS NULL OR ci.reference_type = 'Manual')
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
    echo "Built " . count($missingCIs) . " CashIn Journals.\n";

    // 5. Restore Transfer Legs
    $transfers = DB::select("
        SELECT t.id, t.amount, t.from_bank_id, t.to_bank_id, je.id as je_id
        FROM transfers t
        JOIN journal_entries je ON je.reference_type LIKE '%Transfer' AND je.reference_id = t.id
        WHERE t.deleted_at IS NULL
    ");
    $transferCount = 0;
    foreach ($transfers as $t) {
        if ($t->from_bank_id == 1) {
            DB::table('journal_entry_details')->insert(['journal_entry_id' => $t->je_id, 'chart_of_account_id' => $coa2, 'debit' => 0, 'credit' => $t->amount, 'description' => 'Transfer Keluar']);
            $transferCount++;
        }
        if ($t->to_bank_id == 1) {
            DB::table('journal_entry_details')->insert(['journal_entry_id' => $t->je_id, 'chart_of_account_id' => $coa2, 'debit' => $t->amount, 'credit' => 0, 'description' => 'Transfer Masuk']);
            $transferCount++;
        }
    }
    echo "Restored $transferCount Transfer legs for Kas Mahato.\n";

    // 6. Restore MemberLoan Legs
    $memberLoans = DB::select("
        SELECT ml.id, ml.amount, ml.bank_id, je.id as je_id
        FROM member_loans ml
        JOIN journal_entries je ON je.reference_type LIKE '%MemberLoan' AND je.reference_id = ml.id
        WHERE ml.deleted_at IS NULL AND ml.bank_id = 1
    ");
    $mlCount = 0;
    foreach ($memberLoans as $ml) {
        DB::table('journal_entry_details')->insert(['journal_entry_id' => $ml->je_id, 'chart_of_account_id' => $coa2, 'debit' => 0, 'credit' => $ml->amount, 'description' => 'Pinjaman Anggota']);
        $mlCount++;
    }
    echo "Restored $mlCount MemberLoan legs for Kas Mahato.\n";

    // Validate Kas Mahato Diff Now
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
    echo "Kas Mahato Bank Balance: " . $bank1->balance . "\n";
    echo "Kas Mahato Journal Net: " . $jeNet2 . "\n";
    echo "Kas Mahato Diff: " . ($bank1->balance - $jeNet2) . "\n";
});
