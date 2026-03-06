<?php

use App\Models\StockMovement;
use App\Models\PurchaseDetail;
use App\Models\SaleDetail;
use App\Models\SaleReturnDetail;
use App\Models\PurchaseReturnDetail;
use App\Models\Item;
use Illuminate\Support\Facades\DB;

function cleanupDuplicates($dryRun = true) {
    $types = [
        'Purchase' => [
            'model' => PurchaseDetail::class,
            'foreign_key' => 'purchase_id',
            'direction' => 'IN'
        ],
        'Sale' => [
            'model' => SaleDetail::class,
            'foreign_key' => 'sale_id',
            'direction' => 'OUT'
        ],
        'SaleReturn' => [
            'model' => SaleReturnDetail::class,
            'foreign_key' => 'sale_return_id',
            'direction' => 'IN'
        ],
        'PurchaseReturn' => [
            'model' => PurchaseReturnDetail::class,
            'foreign_key' => 'purchase_return_id',
            'direction' => 'OUT'
        ],
    ];

    foreach ($types as $refType => $config) {
        $detailTable = (new $config['model'])->getTable();
        $fk = $config['foreign_key'];

        echo "Checking $refType...\n";
        
        $duplicates = DB::table('stock_movements as sm')
            ->select('sm.reference_id', 'sm.item_id', DB::raw('count(*) as move_count'))
            ->where('sm.reference_type', $refType)
            ->groupBy('sm.reference_id', 'sm.item_id')
            ->havingRaw('count(*) > (SELECT count(*) FROM ' . $detailTable . ' as d WHERE d.' . $fk . ' = sm.reference_id AND d.item_id = sm.item_id)')
            ->get();

        if ($duplicates->isEmpty()) {
            echo "No duplicates found for $refType.\n";
            continue;
        }

        echo "Found " . $duplicates->count() . " groups with duplicates in $refType.\n";

        foreach ($duplicates as $dup) {
            $movements = StockMovement::where('reference_type', $refType)
                ->where('reference_id', $dup->reference_id)
                ->where('item_id', $dup->item_id)
                ->orderBy('id', 'asc')
                ->get();

            $expectedCount = $config['model']::where($config['foreign_key'], $dup->reference_id)
                ->where('item_id', $dup->item_id)
                ->count();

            $toDelete = $movements->slice($expectedCount);
            
            echo "Group ($refType #{$dup->reference_id}, Item #{$dup->item_id}): Expected $expectedCount, Found {$dup->move_count}. Deleting " . $toDelete->count() . " duplicates.\n";

            foreach ($toDelete as $move) {
                if (!$dryRun) {
                    DB::transaction(function() use ($move, $config) {
                        $item = Item::find($move->item_id);
                        if ($item) {
                            if ($config['direction'] === 'IN') {
                                echo "  - Decrementing stock for Item #{$item->id} by {$move->quantity}\n";
                                $item->decrement('stock', $move->quantity);
                            } else {
                                echo "  - Incrementing stock for Item #{$item->id} by " . abs($move->quantity) . "\n";
                                $item->increment('stock', abs($move->quantity));
                            }
                        }
                        $move->delete();
                    });
                } else {
                    echo "  - [DRY RUN] Would delete movement #{$move->id} and adjust stock.\n";
                }
            }
        }
    }
}

echo "Starting cleanup (DRY RUN)...\n";
cleanupDuplicates(true);
echo "\nTo apply changes, run: cleanupDuplicates(false);\n";
