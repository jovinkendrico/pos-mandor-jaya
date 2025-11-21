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
        Schema::create('cash_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_id')->constrained('banks')->onDelete('cascade');
            $table->string('reference_type')->nullable(); // CashIn, CashOut, SalePayment, PurchasePayment, Bank, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->date('movement_date');
            $table->decimal('debit', 15, 2)->default(0); // Amount masuk
            $table->decimal('credit', 15, 2)->default(0); // Amount keluar
            $table->decimal('balance', 15, 2); // Running balance setelah transaksi ini
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['bank_id', 'movement_date']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_movements');
    }
};
