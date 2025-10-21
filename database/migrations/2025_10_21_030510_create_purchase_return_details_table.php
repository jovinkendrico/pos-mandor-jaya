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
        Schema::create('purchase_return_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_return_id')->constrained('purchase_returns')->onDelete('cascade');
            $table->foreignId('purchase_detail_id')->nullable()->constrained('purchase_details')->onDelete('set null');
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->foreignId('item_uom_id')->constrained('item_uoms')->onDelete('cascade');
            $table->decimal('quantity', 15, 2);
            $table->decimal('price', 15, 2);
            $table->decimal('discount1_percent', 5, 2)->default(0);
            $table->decimal('discount1_amount', 15, 2)->default(0);
            $table->decimal('discount2_percent', 5, 2)->default(0);
            $table->decimal('discount2_amount', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_return_details');
    }
};
