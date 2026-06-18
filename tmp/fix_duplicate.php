<?php
use App\Models\CashOut;
use App\Models\CashMovement;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\Bank;
use Illuminate\Support\Facades\DB;

$cashOutIds = [436, 426];

foreach ($cashOutIds as $id) {
    echo "Fixing CashOut ID: $id\n";
    $co = CashOut::find($id);
    if (!$co) continue;

    DB::transaction(function () use ($co) {
        // Find all cash movements for this CashOut
        $movements = CashMovement::where('reference_type', 'CashOut')
            ->where('reference_id', $co->id)
            ->orderBy('id', 'asc')
            ->get();

        if ($movements->count() > 1) {
            echo "Found {$movements->count()} movements. Keeping the first one (ID: {$movements->first()->id}).\n";
            // Delete all except the first
            $movementsToKeep = $movements->first();
            foreach ($movements as $m) {
                if ($m->id !== $movementsToKeep->id) {
                    $m->delete();
                    echo " - Deleted movement ID: {$m->id}\n";
                }
            }
        } else {
            echo "Movements ok.\n";
        }

        // Find all journal entries for this CashOut
        $journals = JournalEntry::where('reference_type', 'CashOut')
            ->where('reference_id', $co->id)
            ->where('status', 'posted')
            ->orderBy('id', 'asc')
            ->get();

        if ($journals->count() > 1) {
            echo "Found {$journals->count()} journal entries. Keeping the first one (ID: {$journals->first()->id}).\n";
            // Delete all except the first
            $journalToKeep = $journals->first();
            foreach ($journals as $j) {
                if ($j->id !== $journalToKeep->id) {
                    JournalEntryDetail::where('journal_entry_id', $j->id)->delete();
                    $j->delete();
                    echo " - Deleted journal entry ID: {$j->id}\n";
                }
            }
        } else {
            echo "Journal entries ok.\n";
        }
    });
    
    // Recalculate bank balance
    $bank = Bank::find($co->bank_id);
    if ($bank) {
        // Recalculate from the cash out date onwards
        app(\App\Services\CashMovementService::class)->recalculateBalances($bank, $co->cash_out_date);
        echo "Bank balance recalculated for bank ID: {$bank->id}\n";
    }
}
echo "Done.\n";
