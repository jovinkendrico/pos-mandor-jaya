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
        // Add 'cancelled' to cash_ins status enum
        DB::statement("ALTER TABLE `cash_ins` MODIFY COLUMN `status` ENUM('draft', 'posted', 'cancelled') NOT NULL DEFAULT 'draft'");
        
        // Add 'cancelled' to cash_outs status enum
        DB::statement("ALTER TABLE `cash_outs` MODIFY COLUMN `status` ENUM('draft', 'posted', 'cancelled') NOT NULL DEFAULT 'draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'cancelled' from cash_ins status enum
        DB::statement("ALTER TABLE `cash_ins` MODIFY COLUMN `status` ENUM('draft', 'posted') NOT NULL DEFAULT 'draft'");
        
        // Remove 'cancelled' from cash_outs status enum
        DB::statement("ALTER TABLE `cash_outs` MODIFY COLUMN `status` ENUM('draft', 'posted') NOT NULL DEFAULT 'draft'");
    }
};
