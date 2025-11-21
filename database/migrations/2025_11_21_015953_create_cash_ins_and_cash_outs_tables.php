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
        Schema::create('cash_ins', function (Blueprint $table) {
            $table->id();
            $table->string('cash_in_number')->unique();
            $table->date('cash_in_date');
            $table->foreignId('bank_id')->constrained('banks')->cascadeOnDelete();
            $table->foreignId('chart_of_account_id')->constrained('chart_of_accounts')->cascadeOnDelete(); // Akun pendapatan
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'posted'])->default('draft');
            $table->string('reference_type')->nullable(); // Manual, SalePayment, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['cash_in_date', 'status']);
            $table->index(['reference_type', 'reference_id']);
        });

        Schema::create('cash_outs', function (Blueprint $table) {
            $table->id();
            $table->string('cash_out_number')->unique();
            $table->date('cash_out_date');
            $table->foreignId('bank_id')->constrained('banks')->cascadeOnDelete();
            $table->foreignId('chart_of_account_id')->constrained('chart_of_accounts')->cascadeOnDelete(); // Akun pengeluaran
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'posted'])->default('draft');
            $table->string('reference_type')->nullable(); // Manual, PurchasePayment, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['cash_out_date', 'status']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_outs');
        Schema::dropIfExists('cash_ins');
    }
};
