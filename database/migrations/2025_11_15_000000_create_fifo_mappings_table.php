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
        Schema::create('fifo_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('reference_type'); // 'Sale' or 'PurchaseReturn'
            $table->unsignedBigInteger('reference_detail_id'); // sale_detail_id or purchase_return_detail_id
            $table->foreignId('stock_movement_id')->constrained('stock_movements')->cascadeOnDelete();
            $table->decimal('quantity_consumed', 15, 2); // Quantity consumed from this movement
            $table->decimal('unit_cost', 15, 2); // Unit cost at time of consumption
            $table->decimal('total_cost', 15, 2); // quantity_consumed * unit_cost
            $table->timestamps();

            // Index for faster lookups
            $table->index(['reference_type', 'reference_detail_id']);
            $table->index('stock_movement_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fifo_mappings');
    }
};

