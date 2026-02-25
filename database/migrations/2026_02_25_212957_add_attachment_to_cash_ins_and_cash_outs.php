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
        Schema::table('cash_ins', function (Blueprint $table) {
            $table->string('attachment')->nullable()->after('description');
        });

        Schema::table('cash_outs', function (Blueprint $table) {
            $table->string('attachment')->nullable()->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cash_ins', function (Blueprint $table) {
            $table->dropColumn('attachment');
        });

        Schema::table('cash_outs', function (Blueprint $table) {
            $table->dropColumn('attachment');
        });
    }
};
