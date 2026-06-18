<?php
use App\Models\CashOut;
use App\Models\CashMovement;
use App\Models\JournalEntry;

$numbers = ['CO2026051100007', 'CO2026051000001'];

foreach ($numbers as $number) {
    echo "====================================\n";
    echo "Checking $number\n";
    
    $co = CashOut::where('cash_out_number', $number)->first();
    if (!$co) {
        echo "CashOut not found!\n";
        continue;
    }
    
    echo "CashOut ID: {$co->id}, Amount: {$co->amount}, RefType: {$co->reference_type}, RefID: {$co->reference_id}, CreatedAt: {$co->created_at}\n";
    
    $movements = CashMovement::where('reference_type', 'CashOut')
                ->where('reference_id', $co->id)
                ->get();
                
    echo "Movements linked to CashOut:\n";
    foreach ($movements as $m) {
        echo " - ID: {$m->id}, Amount In: {$m->amount_in}, Amount Out: {$m->amount_out}, Desc: {$m->description}, CreatedAt: {$m->created_at}\n";
    }

    // Check if there are any movements linked directly to the Sale if this is from a Sale
    if ($co->reference_type === 'Sale') {
        $saleMovements = CashMovement::where('reference_type', 'Sale')
            ->where('reference_id', $co->reference_id)
            ->get();
            
        echo "Movements linked to Sale ({$co->reference_id}):\n";
        foreach ($saleMovements as $m) {
            echo " - ID: {$m->id}, Amount In: {$m->amount_in}, Amount Out: {$m->amount_out}, Desc: {$m->description}, CreatedAt: {$m->created_at}\n";
        }
    }
    
    // Check journal entries
    $journals = JournalEntry::where(function($q) use ($co) {
        $q->where('reference_type', 'CashOut')->where('reference_id', $co->id);
    })->orWhere(function($q) use ($co) {
        if ($co->reference_type) {
            $q->where('reference_type', $co->reference_type)->where('reference_id', $co->reference_id);
        }
    })->get();
    
    echo "Journal Entries:\n";
    foreach ($journals as $j) {
        echo " - ID: {$j->id}, Type: {$j->reference_type}, Ref: {$j->reference_id}, Status: {$j->status}, Desc: {$j->description}\n";
    }
}
