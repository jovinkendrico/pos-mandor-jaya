<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds performance indexes for frequently queried columns to improve query speed.
     */
    public function up(): void
    {
        // Helper function to check if index exists
        $hasIndex = function ($table, $indexName) {
            $connection = Schema::getConnection();
            $database = $connection->getDatabaseName();

            $result = $connection->select(
                "SELECT COUNT(*) as count FROM information_schema.statistics
                 WHERE table_schema = ? AND table_name = ? AND index_name = ?",
                [$database, $table, $indexName]
            );

            return $result[0]->count > 0;
        };

        // Sales table indexes
        Schema::table('sales', function (Blueprint $table) use ($hasIndex) {
            // Index for date range queries (most common in reports)
            if (!$hasIndex('sales', 'idx_sales_sale_date')) {
                $table->index('sale_date', 'idx_sales_sale_date');
            }
            // Index for status filtering
            if (!$hasIndex('sales', 'idx_sales_status')) {
                $table->index('status', 'idx_sales_status');
            }
            // Index for customer lookups
            if (!$hasIndex('sales', 'idx_sales_customer_id')) {
                $table->index('customer_id', 'idx_sales_customer_id');
            }
            // Composite index for common query pattern: date + status
            if (!$hasIndex('sales', 'idx_sales_date_status')) {
                $table->index(['sale_date', 'status'], 'idx_sales_date_status');
            }
            // Composite index for customer + date queries (may already exist)
            if (!$hasIndex('sales', 'idx_sales_customer_date')) {
                $table->index(['customer_id', 'sale_date'], 'idx_sales_customer_date');
            }
            // Index for due_date (for aging reports)
            if (!$hasIndex('sales', 'idx_sales_due_date')) {
                $table->index('due_date', 'idx_sales_due_date');
            }
        });

        // Purchases table indexes
        Schema::table('purchases', function (Blueprint $table) use ($hasIndex) {
            // Index for date range queries
            if (!$hasIndex('purchases', 'idx_purchases_purchase_date')) {
                $table->index('purchase_date', 'idx_purchases_purchase_date');
            }
            // Index for status filtering
            if (!$hasIndex('purchases', 'idx_purchases_status')) {
                $table->index('status', 'idx_purchases_status');
            }
            // Index for supplier lookups
            if (!$hasIndex('purchases', 'idx_purchases_supplier_id')) {
                $table->index('supplier_id', 'idx_purchases_supplier_id');
            }
            // Composite index for common query pattern: date + status
            if (!$hasIndex('purchases', 'idx_purchases_date_status')) {
                $table->index(['purchase_date', 'status'], 'idx_purchases_date_status');
            }
            // Composite index for supplier + date queries (may already exist)
            if (!$hasIndex('purchases', 'idx_purchases_supplier_date')) {
                $table->index(['supplier_id', 'purchase_date'], 'idx_purchases_supplier_date');
            }
            // Index for due_date (for aging reports)
            if (!$hasIndex('purchases', 'idx_purchases_due_date')) {
                $table->index('due_date', 'idx_purchases_due_date');
            }
        });

        // Items table indexes
        Schema::table('items', function (Blueprint $table) use ($hasIndex) {
            // Index for name search (LIKE queries)
            if (!$hasIndex('items', 'idx_items_name')) {
                $table->index('name', 'idx_items_name');
            }
            // Note: 'code' already has unique index, no need to add another
        });

        // Customers table indexes
        Schema::table('customers', function (Blueprint $table) use ($hasIndex) {
            // Index for name search
            if (!$hasIndex('customers', 'idx_customers_name')) {
                $table->index('name', 'idx_customers_name');
            }
            // Index for city filtering
            if (!$hasIndex('customers', 'idx_customers_city_id')) {
                $table->index('city_id', 'idx_customers_city_id');
            }
        });

        // Suppliers table indexes
        Schema::table('suppliers', function (Blueprint $table) use ($hasIndex) {
            // Index for name search
            if (!$hasIndex('suppliers', 'idx_suppliers_name')) {
                $table->index('name', 'idx_suppliers_name');
            }
            // Index for city filtering
            if (!$hasIndex('suppliers', 'idx_suppliers_city_id')) {
                $table->index('city_id', 'idx_suppliers_city_id');
            }
        });

        // Sale Details table indexes
        Schema::table('sale_details', function (Blueprint $table) use ($hasIndex) {
            // Index for item lookups in reports
            if (!$hasIndex('sale_details', 'idx_sale_details_item_id')) {
                $table->index('item_id', 'idx_sale_details_item_id');
            }
            // Index for sale lookups
            if (!$hasIndex('sale_details', 'idx_sale_details_sale_id')) {
                $table->index('sale_id', 'idx_sale_details_sale_id');
            }
            // Composite index for item-based reports (may already exist as idx_sale_details_sale_item)
            if (!$hasIndex('sale_details', 'idx_sale_details_item_sale') && !$hasIndex('sale_details', 'idx_sale_details_sale_item')) {
                $table->index(['item_id', 'sale_id'], 'idx_sale_details_item_sale');
            }
        });

        // Purchase Details table indexes
        Schema::table('purchase_details', function (Blueprint $table) use ($hasIndex) {
            // Index for item lookups in reports
            if (!$hasIndex('purchase_details', 'idx_purchase_details_item_id')) {
                $table->index('item_id', 'idx_purchase_details_item_id');
            }
            // Index for purchase lookups
            if (!$hasIndex('purchase_details', 'idx_purchase_details_purchase_id')) {
                $table->index('purchase_id', 'idx_purchase_details_purchase_id');
            }
            // Composite index for item-based reports
            if (!$hasIndex('purchase_details', 'idx_purchase_details_item_purchase')) {
                $table->index(['item_id', 'purchase_id'], 'idx_purchase_details_item_purchase');
            }
        });

        // Stock Movements table - already has indexes, but let's add one more for remaining_quantity queries
        Schema::table('stock_movements', function (Blueprint $table) use ($hasIndex) {
            // Index for FIFO queries (remaining_quantity > 0)
            if (!$hasIndex('stock_movements', 'idx_stock_movements_item_remaining')) {
                $table->index(['item_id', 'remaining_quantity'], 'idx_stock_movements_item_remaining');
            }
        });

        // Sale Returns table indexes
        if (Schema::hasTable('sale_returns')) {
            Schema::table('sale_returns', function (Blueprint $table) use ($hasIndex) {
                if (!$hasIndex('sale_returns', 'idx_sale_returns_return_date')) {
                    $table->index('return_date', 'idx_sale_returns_return_date');
                }
                if (!$hasIndex('sale_returns', 'idx_sale_returns_status')) {
                    $table->index('status', 'idx_sale_returns_status');
                }
                if (!$hasIndex('sale_returns', 'idx_sale_returns_sale_id')) {
                    $table->index('sale_id', 'idx_sale_returns_sale_id');
                }
                if (!$hasIndex('sale_returns', 'idx_sale_returns_date_status')) {
                    $table->index(['return_date', 'status'], 'idx_sale_returns_date_status');
                }
            });
        }

        // Purchase Returns table indexes
        if (Schema::hasTable('purchase_returns')) {
            Schema::table('purchase_returns', function (Blueprint $table) use ($hasIndex) {
                if (!$hasIndex('purchase_returns', 'idx_purchase_returns_return_date')) {
                    $table->index('return_date', 'idx_purchase_returns_return_date');
                }
                if (!$hasIndex('purchase_returns', 'idx_purchase_returns_status')) {
                    $table->index('status', 'idx_purchase_returns_status');
                }
                if (!$hasIndex('purchase_returns', 'idx_purchase_returns_purchase_id')) {
                    $table->index('purchase_id', 'idx_purchase_returns_purchase_id');
                }
                if (!$hasIndex('purchase_returns', 'idx_purchase_returns_date_status')) {
                    $table->index(['return_date', 'status'], 'idx_purchase_returns_date_status');
                }
            });
        }

        // Sale Payments table indexes (if exists)
        if (Schema::hasTable('sale_payments')) {
            Schema::table('sale_payments', function (Blueprint $table) use ($hasIndex) {
                if (!$hasIndex('sale_payments', 'idx_sale_payments_payment_date')) {
                    $table->index('payment_date', 'idx_sale_payments_payment_date');
                }
                if (!$hasIndex('sale_payments', 'idx_sale_payments_status')) {
                    $table->index('status', 'idx_sale_payments_status');
                }
            });
        }

        // Purchase Payments table indexes (if exists)
        if (Schema::hasTable('purchase_payments')) {
            Schema::table('purchase_payments', function (Blueprint $table) use ($hasIndex) {
                if (!$hasIndex('purchase_payments', 'idx_purchase_payments_payment_date')) {
                    $table->index('payment_date', 'idx_purchase_payments_payment_date');
                }
                if (!$hasIndex('purchase_payments', 'idx_purchase_payments_status')) {
                    $table->index('status', 'idx_purchase_payments_status');
                }
            });
        }

        // Cash Ins table indexes (if exists)
        if (Schema::hasTable('cash_ins')) {
            Schema::table('cash_ins', function (Blueprint $table) use ($hasIndex) {
                if (!$hasIndex('cash_ins', 'idx_cash_ins_date')) {
                    $table->index('cash_in_date', 'idx_cash_ins_date');
                }
                if (!$hasIndex('cash_ins', 'idx_cash_ins_status')) {
                    $table->index('status', 'idx_cash_ins_status');
                }
            });
        }

        // Cash Outs table indexes (if exists)
        if (Schema::hasTable('cash_outs')) {
            Schema::table('cash_outs', function (Blueprint $table) use ($hasIndex) {
                if (!$hasIndex('cash_outs', 'idx_cash_outs_date')) {
                    $table->index('cash_out_date', 'idx_cash_outs_date');
                }
                if (!$hasIndex('cash_outs', 'idx_cash_outs_status')) {
                    $table->index('status', 'idx_cash_outs_status');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Sales table
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('idx_sales_sale_date');
            $table->dropIndex('idx_sales_status');
            $table->dropIndex('idx_sales_customer_id');
            $table->dropIndex('idx_sales_date_status');
            $table->dropIndex('idx_sales_customer_date');
            $table->dropIndex('idx_sales_due_date');
        });

        // Purchases table
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex('idx_purchases_purchase_date');
            $table->dropIndex('idx_purchases_status');
            $table->dropIndex('idx_purchases_supplier_id');
            $table->dropIndex('idx_purchases_date_status');
            $table->dropIndex('idx_purchases_supplier_date');
            $table->dropIndex('idx_purchases_due_date');
        });

        // Items table
        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex('idx_items_name');
        });

        // Customers table
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex('idx_customers_name');
            $table->dropIndex('idx_customers_city_id');
        });

        // Suppliers table
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropIndex('idx_suppliers_name');
            $table->dropIndex('idx_suppliers_city_id');
        });

        // Sale Details table
        Schema::table('sale_details', function (Blueprint $table) {
            $table->dropIndex('idx_sale_details_item_id');
            $table->dropIndex('idx_sale_details_sale_id');
            $table->dropIndex('idx_sale_details_item_sale');
        });

        // Purchase Details table
        Schema::table('purchase_details', function (Blueprint $table) {
            $table->dropIndex('idx_purchase_details_item_id');
            $table->dropIndex('idx_purchase_details_purchase_id');
            $table->dropIndex('idx_purchase_details_item_purchase');
        });

        // Stock Movements table
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex('idx_stock_movements_item_remaining');
        });

        // Sale Returns table
        if (Schema::hasTable('sale_returns')) {
            Schema::table('sale_returns', function (Blueprint $table) {
                $table->dropIndex('idx_sale_returns_return_date');
                $table->dropIndex('idx_sale_returns_status');
                $table->dropIndex('idx_sale_returns_sale_id');
                $table->dropIndex('idx_sale_returns_date_status');
            });
        }

        // Purchase Returns table
        if (Schema::hasTable('purchase_returns')) {
            Schema::table('purchase_returns', function (Blueprint $table) {
                $table->dropIndex('idx_purchase_returns_return_date');
                $table->dropIndex('idx_purchase_returns_status');
                $table->dropIndex('idx_purchase_returns_purchase_id');
                $table->dropIndex('idx_purchase_returns_date_status');
            });
        }

        // Sale Payments table
        if (Schema::hasTable('sale_payments')) {
            Schema::table('sale_payments', function (Blueprint $table) {
                $table->dropIndex('idx_sale_payments_payment_date');
                $table->dropIndex('idx_sale_payments_status');
            });
        }

        // Purchase Payments table
        if (Schema::hasTable('purchase_payments')) {
            Schema::table('purchase_payments', function (Blueprint $table) {
                $table->dropIndex('idx_purchase_payments_payment_date');
                $table->dropIndex('idx_purchase_payments_status');
            });
        }

        // Cash Ins table
        if (Schema::hasTable('cash_ins')) {
            Schema::table('cash_ins', function (Blueprint $table) {
                $table->dropIndex('idx_cash_ins_date');
                $table->dropIndex('idx_cash_ins_status');
            });
        }

        // Cash Outs table
        if (Schema::hasTable('cash_outs')) {
            Schema::table('cash_outs', function (Blueprint $table) {
                $table->dropIndex('idx_cash_outs_date');
                $table->dropIndex('idx_cash_outs_status');
            });
        }
    }
};
