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
        Schema::table('purchase_details', function (Blueprint $table) {
            $table->decimal('quantity', 15, 4)->comment('Kuantitas barang')->change();
            $table->decimal('price', 15, 4)->comment('Harga beli per UOM')->change();
        });

        Schema::table('sale_details', function (Blueprint $table) {
            $table->decimal('quantity', 15, 4)->comment('Kuantitas barang')->change();
            $table->decimal('price', 15, 4)->comment('Harga jual per UOM')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_details', function (Blueprint $table) {
            $table->decimal('quantity', 15, 2)->change();
            $table->decimal('price', 15, 2)->change();
        });

        Schema::table('sale_details', function (Blueprint $table) {
            $table->decimal('quantity', 15, 2)->change();
            $table->decimal('price', 15, 2)->change();
        });
    }
};
