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
        Schema::create('purchase_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->foreignId('item_uom_id')->constrained('item_uoms')->cascadeOnDelete();
            $table->decimal('quantity', 15, 2);
            $table->decimal('price', 15, 2); // Harga beli per UOM
            $table->decimal('discount1_percent', 5, 2)->default(0); // Diskon 1 per item dalam %
            $table->decimal('discount1_amount', 15, 2)->default(0); // Diskon 1 per item dalam nominal
            $table->decimal('discount2_percent', 5, 2)->default(0); // Diskon 2 per item dalam %
            $table->decimal('discount2_amount', 15, 2)->default(0); // Diskon 2 per item dalam nominal
            $table->decimal('subtotal', 15, 2); // Total setelah diskon 1 & 2
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_details');
    }
};
