<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('pph_amount', 15, 2)->default(0)->after('ppn_amount');
            $table->decimal('biaya_pks_amount', 15, 2)->default(0)->after('pph_amount');
        });

        Schema::table('sale_details', function (Blueprint $table) {
            $table->decimal('pph_percent', 5, 2)->default(0)->after('profit_status');
            $table->decimal('pph_amount', 15, 2)->default(0)->after('pph_percent');
            $table->decimal('biaya_pks_per_qty', 15, 2)->default(0)->after('pph_amount');
            $table->decimal('biaya_pks_amount', 15, 2)->default(0)->after('biaya_pks_per_qty');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['pph_amount', 'biaya_pks_amount']);
        });

        Schema::table('sale_details', function (Blueprint $table) {
            $table->dropColumn(['pph_percent', 'pph_amount', 'biaya_pks_per_qty', 'biaya_pks_amount']);
        });
    }
};
