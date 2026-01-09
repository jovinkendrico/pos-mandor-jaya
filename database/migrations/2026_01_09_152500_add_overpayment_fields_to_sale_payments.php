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
        Schema::table('sale_payments', function (Blueprint $table) {
            $table->decimal('overpayment_amount', 15, 2)->default(0)->after('total_amount');
            $table->enum('overpayment_status', ['none', 'pending', 'refunded', 'converted_to_income'])
                ->default('none')
                ->after('overpayment_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_payments', function (Blueprint $table) {
            $table->dropColumn(['overpayment_amount', 'overpayment_status']);
        });
    }
};
