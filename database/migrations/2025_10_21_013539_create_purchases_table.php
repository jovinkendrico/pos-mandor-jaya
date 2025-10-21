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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('purchase_number')->unique();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->date('purchase_date');
            $table->date('due_date')->nullable(); // Tanggal jatuh tempo
            $table->decimal('subtotal', 15, 2)->default(0); // Subtotal sebelum diskon & PPN
            $table->decimal('discount1_percent', 5, 2)->default(0); // Diskon 1 dalam %
            $table->decimal('discount1_amount', 15, 2)->default(0); // Diskon 1 dalam nominal
            $table->decimal('discount2_percent', 5, 2)->default(0); // Diskon 2 dalam %
            $table->decimal('discount2_amount', 15, 2)->default(0); // Diskon 2 dalam nominal
            $table->decimal('total_after_discount', 15, 2)->default(0); // Total setelah diskon
            $table->decimal('ppn_percent', 5, 2)->default(0); // PPN dalam %
            $table->decimal('ppn_amount', 15, 2)->default(0); // PPN dalam nominal
            $table->decimal('total_amount', 15, 2)->default(0); // Grand total
            $table->enum('status', ['pending', 'confirmed'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
