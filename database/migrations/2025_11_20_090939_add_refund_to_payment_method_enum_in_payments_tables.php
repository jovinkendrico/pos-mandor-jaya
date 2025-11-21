<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For sale_payments table
        DB::statement("ALTER TABLE sale_payments MODIFY COLUMN payment_method ENUM('cash', 'transfer', 'giro', 'cek', 'other', 'refund') DEFAULT 'cash'");

        // For purchase_payments table
        DB::statement("ALTER TABLE purchase_payments MODIFY COLUMN payment_method ENUM('cash', 'transfer', 'giro', 'cek', 'other', 'refund') DEFAULT 'cash'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'refund' from enum (revert to original)
        DB::statement("ALTER TABLE sale_payments MODIFY COLUMN payment_method ENUM('cash', 'transfer', 'giro', 'cek', 'other') DEFAULT 'cash'");

        DB::statement("ALTER TABLE purchase_payments MODIFY COLUMN payment_method ENUM('cash', 'transfer', 'giro', 'cek', 'other') DEFAULT 'cash'");
    }
};
