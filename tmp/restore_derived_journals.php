<?php

use Illuminate\Support\Facades\DB;
use App\Models\JournalEntry;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    echo "=== RESTORING THE DERIVED CASH JOURNALS ===\n";
    $date = now()->format('Y-m-d H:i:s');

    // Restore missing CashOuts that are derived from PurchasePayment etc (anything except Transfer, MemberLoan which have own journals)
    $missingCOs = DB::select("
        SELECT co.*, b.chart_of_account_id as bank_coa
        FROM cash_outs co
        LEFT JOIN banks b ON co.bank_id = b.id
        LEFT JOIN journal_entries je ON je.reference_type = 'CashOut' AND je.reference_id = co.id
        WHERE co.status IN ('posted', 'confirmed') AND co.deleted_at IS NULL
        AND je.id IS NULL
        AND (co.reference_type IS NOT NULL AND co.reference_type != 'Manual')
    ");
    
    $restoredCOs = 0;
    foreach ($missingCOs as $co) {
        $skip = false;
        // Check if parent has its own journal
        if (str_contains($co->reference_type, 'Transfer') || str_contains($co->reference_type, 'MemberLoan') && !str_contains($co->reference_type, 'Payment')) {
            $skip = true; // Handled by App\Models\Transfer and App\Models\MemberLoan directly
        }
        if (str_contains($co->reference_type, 'OverpaymentTransaction')) {
            $hasOwn = DB::table('journal_entries')->where('reference_type', 'OverpaymentTransaction')->where('reference_id', $co->reference_id)->exists();
            if ($hasOwn) $skip = true;
        }
        
        if (!$skip) {
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
                DB::table('journal_entry_details')->insert(['journal_entry_id' => $jeId, 'chart_of_account_id' => $co->chart_of_account_id, 'debit' => $co->amount, 'credit' => 0, 'description' => "Kas Keluar", 'vehicle_id' => $co->vehicle_id]);
            }
            if ($co->bank_coa) {
                DB::table('journal_entry_details')->insert(['journal_entry_id' => $jeId, 'chart_of_account_id' => $co->bank_coa, 'debit' => 0, 'credit' => $co->amount, 'description' => "Kas Keluar"]);
            }
            $restoredCOs++;
        }
    }
    echo "Restored $restoredCOs derived CashOut Journals.\n";

    // Restore missing CashIns
    $missingCIs = DB::select("
        SELECT ci.*, b.chart_of_account_id as bank_coa
        FROM cash_ins ci
        LEFT JOIN banks b ON ci.bank_id = b.id
        LEFT JOIN journal_entries je ON je.reference_type = 'CashIn' AND je.reference_id = ci.id
        WHERE ci.status IN ('posted', 'confirmed') AND ci.deleted_at IS NULL
        AND je.id IS NULL
        AND (ci.reference_type IS NOT NULL AND ci.reference_type != 'Manual')
    ");
    
    $restoredCIs = 0;
    foreach ($missingCIs as $ci) {
        $skip = false;
        if (str_contains($ci->reference_type, 'Transfer')) {
            $skip = true;
        }
        if (str_contains($ci->reference_type, 'SalePayment')) {
            $hasOwn = DB::table('journal_entries')->where('reference_type', 'SalePayment')->where('reference_id', $ci->reference_id)->exists();
            if ($hasOwn) $skip = true;
        }
        
        if (!$skip) {
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
                DB::table('journal_entry_details')->insert(['journal_entry_id' => $jeId, 'chart_of_account_id' => $ci->bank_coa, 'debit' => $ci->amount, 'credit' => 0, 'description' => "Kas Masuk"]);
            }
            if ($ci->chart_of_account_id) {
                DB::table('journal_entry_details')->insert(['journal_entry_id' => $jeId, 'chart_of_account_id' => $ci->chart_of_account_id, 'debit' => 0, 'credit' => $ci->amount, 'description' => "Kas Masuk"]);
            }
            $restoredCIs++;
        }
    }
    echo "Restored $restoredCIs derived CashIn Journals.\n";

    // Validate Kas Mahato Diff Now
    $bank1 = DB::table('banks')->where('id', 1)->first();
    $coa2 = $bank1->chart_of_account_id ?? 2;

    $d2 = DB::table('journal_entry_details')->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')->where('journal_entries.status', 'posted')->where('chart_of_account_id', $coa2)->sum('debit');
    $c2 = DB::table('journal_entry_details')->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')->where('journal_entries.status', 'posted')->where('chart_of_account_id', $coa2)->sum('credit');
    
    $jeNet2 = $d2 - $c2;
    echo "Kas Mahato Bank Balance: " . $bank1->balance . "\n";
    echo "Kas Mahato Journal Net: " . $jeNet2 . "\n";
    echo "Kas Mahato Diff: " . ($bank1->balance - $jeNet2) . "\n";
});
