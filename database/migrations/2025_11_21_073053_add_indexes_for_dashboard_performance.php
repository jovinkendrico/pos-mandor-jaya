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
        // Indexes for sales table
        Schema::table('sales', function (Blueprint $table) {
            $table->index(['status', 'sale_date'], 'idx_sales_status_date');
            $table->index(['status', 'due_date'], 'idx_sales_status_due_date');
            $table->index(['customer_id', 'sale_date'], 'idx_sales_customer_date');
        });

        // Indexes for purchases table
        Schema::table('purchases', function (Blueprint $table) {
            $table->index(['status', 'purchase_date'], 'idx_purchases_status_date');
            $table->index(['status', 'due_date'], 'idx_purchases_status_due_date');
            $table->index(['supplier_id', 'purchase_date'], 'idx_purchases_supplier_date');
        });

        // Indexes for sale_payment_items
        Schema::table('sale_payment_items', function (Blueprint $table) {
            $table->index('sale_id', 'idx_sale_payment_items_sale_id');
        });

        // Indexes for purchase_payment_items
        Schema::table('purchase_payment_items', function (Blueprint $table) {
            $table->index('purchase_id', 'idx_purchase_payment_items_purchase_id');
        });

        // Indexes for sale_payments
        Schema::table('sale_payments', function (Blueprint $table) {
            $table->index(['status', 'payment_date'], 'idx_sale_payments_status_date');
        });

        // Indexes for purchase_payments
        Schema::table('purchase_payments', function (Blueprint $table) {
            $table->index(['status', 'payment_date'], 'idx_purchase_payments_status_date');
        });

        // Indexes for sale_details
        Schema::table('sale_details', function (Blueprint $table) {
            $table->index(['sale_id', 'item_id'], 'idx_sale_details_sale_item');
        });

        // Indexes for items
        Schema::table('items', function (Blueprint $table) {
            $table->index('stock', 'idx_items_stock');
        });

        // Indexes for stock_movements
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->index(['reference_type', 'movement_date'], 'idx_stock_movements_ref_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('idx_sales_status_date');
            $table->dropIndex('idx_sales_status_due_date');
            $table->dropIndex('idx_sales_customer_date');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex('idx_purchases_status_date');
            $table->dropIndex('idx_purchases_status_due_date');
            $table->dropIndex('idx_purchases_supplier_date');
        });

        Schema::table('sale_payment_items', function (Blueprint $table) {
            $table->dropIndex('idx_sale_payment_items_sale_id');
        });

        Schema::table('purchase_payment_items', function (Blueprint $table) {
            $table->dropIndex('idx_purchase_payment_items_purchase_id');
        });

        Schema::table('sale_payments', function (Blueprint $table) {
            $table->dropIndex('idx_sale_payments_status_date');
        });

        Schema::table('purchase_payments', function (Blueprint $table) {
            $table->dropIndex('idx_purchase_payments_status_date');
        });

        Schema::table('sale_details', function (Blueprint $table) {
            $table->dropIndex('idx_sale_details_sale_item');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex('idx_items_stock');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex('idx_stock_movements_ref_date');
        });
    }
};
