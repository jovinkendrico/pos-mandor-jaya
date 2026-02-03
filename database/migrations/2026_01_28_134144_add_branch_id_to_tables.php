<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Tables to add branch_id to
     */
    protected $tables = [
        'users',
        'sales',
        'purchases',
        'purchase_returns',
        'sale_returns',
        'transfers',
        'stock_movements',
        'fifo_mappings',
        'journal_entries',
        'cash_movements',
        'cash_ins',
        'cash_outs',
        'banks', // Banks also belong to a branch
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get the default branch ID (should be 1 from the previous migration)
        $defaultBranchId = DB::table('branches')->where('code', 'PST')->value('id');

        if (!$defaultBranchId) {
            // Fallback if not found (shouldn't happen if migrations run in order)
            $defaultBranchId = DB::table('branches')->insertGetId([
                'code' => 'PST',
                'name' => 'Pusat',
                'is_head_office' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (!Schema::hasColumn($tableName, 'branch_id')) {
                        $table->foreignId('branch_id')
                              ->nullable() // Initially nullable to allow adding column
                              ->after('id')
                              ->constrained('branches')
                              ->nullOnDelete();
                    }
                });

                // Update existing records to default branch
                DB::table($tableName)->update(['branch_id' => $defaultBranchId]);
            }
        }
        
        // Migrate legacy Stock to ItemStock (Pusat)
        // Move Global Stock -> ItemStock for Pusat
        $items = DB::table('items')->get();
        $stockData = [];
        foreach ($items as $item) {
            if ($item->stock != 0) {
                $stockData[] = [
                    'branch_id' => $defaultBranchId,
                    'item_id' => $item->id,
                    'quantity' => $item->stock,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }
        
        // Batch insert to avoid thousands of queries
        if (!empty($stockData)) {
            $chunks = array_chunk($stockData, 500);
            foreach ($chunks as $chunk) {
                DB::table('item_stocks')->insertOrIgnore($chunk);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'branch_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropForeign(['branch_id']);
                    $table->dropColumn('branch_id');
                });
            }
        }
    }
};
