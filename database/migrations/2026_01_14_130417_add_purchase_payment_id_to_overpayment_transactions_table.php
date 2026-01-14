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
        Schema::table('overpayment_transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('sale_payment_id')->nullable()->change();
            $table->unsignedBigInteger('purchase_payment_id')->nullable()->after('sale_payment_id');
            $table->foreign('purchase_payment_id')->references('id')->on('purchase_payments')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('overpayment_transactions', function (Blueprint $table) {
            $table->dropForeign(['purchase_payment_id']);
            $table->dropColumn('purchase_payment_id');
            $table->unsignedBigInteger('sale_payment_id')->nullable(false)->change();
        });
    }
};
