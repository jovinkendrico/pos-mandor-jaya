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
        Schema::table('fifo_mappings', function (Blueprint $table) {
            $table->boolean('is_estimated')->default(false)->after('total_cost');
            $table->unsignedBigInteger('stock_movement_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fifo_mappings', function (Blueprint $table) {
            $table->dropColumn('is_estimated');
            $table->unsignedBigInteger('stock_movement_id')->nullable(false)->change();
        });
    }
};
