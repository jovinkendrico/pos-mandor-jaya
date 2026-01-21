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
            $table->string('transaction_type')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('overpayment_transactions', function (Blueprint $table) {
            $table->enum('transaction_type', ['refund', 'convert_to_income'])->change();
        });
    }
};
