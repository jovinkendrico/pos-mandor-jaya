<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('item_uoms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->foreignId('uom_id')->constrained('uoms')->cascadeOnDelete();
            $table->integer('conversion_value')->default(1)->nullable(false);
            $table->decimal('price', 15, 2)->default(0)->nullable(false);
            $table->boolean('is_base')->default(false);
            $table->timestamps();
            $table->softDeletes();

            // Unique constraint: satu item tidak boleh punya UOM yang sama 2x
            $table->unique(['item_id', 'uom_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_uoms');
    }
};
