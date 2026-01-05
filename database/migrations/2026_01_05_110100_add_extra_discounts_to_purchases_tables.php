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
        Schema::table('purchases', function (Blueprint $table) {
            if (!Schema::hasColumn('purchases', 'discount3_percent')) {
                $table->decimal('discount3_percent', 8, 4)->default(0)->after('discount2_amount');
            }
            if (!Schema::hasColumn('purchases', 'discount3_amount')) {
                $table->decimal('discount3_amount', 15, 2)->default(0)->after('discount3_percent');
            }
            if (!Schema::hasColumn('purchases', 'discount4_percent')) {
                $table->decimal('discount4_percent', 8, 4)->default(0)->after('discount3_amount');
            }
            if (!Schema::hasColumn('purchases', 'discount4_amount')) {
                $table->decimal('discount4_amount', 15, 2)->default(0)->after('discount4_percent');
            }
        });

        Schema::table('purchase_details', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_details', 'discount3_percent')) {
                $table->decimal('discount3_percent', 8, 4)->default(0)->after('discount2_amount');
            }
            if (!Schema::hasColumn('purchase_details', 'discount3_amount')) {
                $table->decimal('discount3_amount', 15, 2)->default(0)->after('discount3_percent');
            }
            if (!Schema::hasColumn('purchase_details', 'discount4_percent')) {
                $table->decimal('discount4_percent', 8, 4)->default(0)->after('discount3_amount');
            }
            if (!Schema::hasColumn('purchase_details', 'discount4_amount')) {
                $table->decimal('discount4_amount', 15, 2)->default(0)->after('discount4_percent');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn(['discount3_percent', 'discount3_amount', 'discount4_percent', 'discount4_amount']);
        });

        Schema::table('purchase_details', function (Blueprint $table) {
            $table->dropColumn(['discount3_percent', 'discount3_amount', 'discount4_percent', 'discount4_amount']);
        });
    }
};
