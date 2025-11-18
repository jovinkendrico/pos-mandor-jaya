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
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->string('journal_number')->unique(); // Nomor jurnal, contoh: JRN-20251118-0001
            $table->date('journal_date');
            $table->string('reference_type')->nullable(); // Purchase, Sale, PurchaseReturn, SaleReturn, Manual, etc.
            $table->unsignedBigInteger('reference_id')->nullable(); // ID dari reference_type
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'posted', 'reversed'])->default('draft');
            $table->unsignedBigInteger('reversed_by')->nullable(); // ID dari journal yang membatalkan
            $table->timestamps();
            $table->softDeletes();

            $table->index(['journal_date', 'status']);
            $table->index(['reference_type', 'reference_id']);
        });

        Schema::create('journal_entry_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained('journal_entries')->cascadeOnDelete();
            $table->foreignId('chart_of_account_id')->constrained('chart_of_accounts')->cascadeOnDelete();
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('journal_entry_id');
            $table->index('chart_of_account_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journal_entry_details');
        Schema::dropIfExists('journal_entries');
    }
};
