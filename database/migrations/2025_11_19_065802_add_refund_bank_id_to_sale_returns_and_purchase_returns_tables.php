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
            $table->foreignId('refund_bank_id')->nullable()->after('return_type')->constrained('banks')->onDelete('set null');
        });

        Schema::table('purchase_returns', function (Blueprint $table) {
            $table->foreignId('refund_bank_id')->nullable()->after('return_type')->constrained('banks')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_returns', function (Blueprint $table) {
            $table->dropForeign(['refund_bank_id']);
            $table->dropColumn('refund_bank_id');
        });

        Schema::table('purchase_returns', function (Blueprint $table) {
            $table->dropForeign(['refund_bank_id']);
            $table->dropColumn('refund_bank_id');
        });
    }
};
