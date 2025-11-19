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
        Schema::table('sale_returns', function (Blueprint $table) {
            $table->enum('return_type', ['stock_only', 'stock_and_refund'])->default('stock_only')->after('status');
        });

        Schema::table('purchase_returns', function (Blueprint $table) {
            $table->enum('return_type', ['stock_only', 'stock_and_refund'])->default('stock_only')->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_returns', function (Blueprint $table) {
            $table->dropColumn('return_type');
        });

        Schema::table('purchase_returns', function (Blueprint $table) {
            $table->dropColumn('return_type');
        });
    }
};
