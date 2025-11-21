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
            $table->enum('refund_method', ['reduce_receivable', 'cash_refund'])->nullable()->after('refund_bank_id');
        });

        Schema::table('purchase_returns', function (Blueprint $table) {
            $table->enum('refund_method', ['reduce_payable', 'cash_refund'])->nullable()->after('refund_bank_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_returns', function (Blueprint $table) {
            $table->dropColumn('refund_method');
        });

        Schema::table('purchase_returns', function (Blueprint $table) {
            $table->dropColumn('refund_method');
        });
    }
};
