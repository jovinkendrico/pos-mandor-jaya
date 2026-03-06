<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_loans', function (Blueprint $table) {
            $table->id();
            $table->string('loan_number')->unique();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->date('loan_date');
            $table->decimal('amount', 15, 2);
            $table->foreignId('bank_id')->nullable()->constrained('banks')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'confirmed'])->default('pending');
            $table->boolean('is_opening_balance')->default(false);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_loans');
    }
};
