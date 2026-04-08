<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    // Delete duplicate CashOut Journals
    $coSql = "
        SELECT je.id 
        FROM journal_entries je
        JOIN cash_outs co ON je.reference_id = co.id AND je.reference_type = 'CashOut'
        WHERE co.reference_type IS NOT NULL
    ";
    $jeIdsToDelete = DB::select($coSql);
    $ids = array_column($jeIdsToDelete, 'id');
    
    if (count($ids) > 0) {
        DB::table('journal_entry_details')->whereIn('journal_entry_id', $ids)->delete();
        DB::table('journal_entries')->whereIn('id', $ids)->delete();
        echo "Deleted " . count($ids) . " Duplicate CashOut Journals.\n";
    }

    // Delete duplicate CashIn Journals
    $ciSql = "
        SELECT je.id 
        FROM journal_entries je
        JOIN cash_ins ci ON je.reference_id = ci.id AND je.reference_type = 'CashIn'
        WHERE ci.reference_type IS NOT NULL
    ";
    $jeIdsToDelete = DB::select($ciSql);
    $ids = array_column($jeIdsToDelete, 'id');
    
    if (count($ids) > 0) {
        DB::table('journal_entry_details')->whereIn('journal_entry_id', $ids)->delete();
        DB::table('journal_entries')->whereIn('id', $ids)->delete();
        echo "Deleted " . count($ids) . " Duplicate CashIn Journals.\n";
    }

    // Final Validation!
    $bankId = 1;
    $coaId = 2;
    $bank = DB::table('banks')->where('id', $bankId)->first();
    
    $d = DB::table('journal_entry_details')
        ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.status', 'posted')
        ->where('chart_of_account_id', $coaId)
        ->sum('debit');
        
    $c = DB::table('journal_entry_details')
        ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.status', 'posted')
        ->where('chart_of_account_id', $coaId)
        ->sum('credit');
        
    echo "Kas Mahato Bank Balance: " . $bank->balance . "\n";
    echo "Kas Mahato Journal Net: " . ($d - $c) . "\n";
    echo "Diff: " . ($bank->balance - ($d - $c)) . "\n";
});
