<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Purchase;
use App\Models\SalePayment;
use App\Models\PurchasePayment;
use App\Models\Bank;
use App\Models\Item;
use App\Models\SaleDetail;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\StockMovement;
use App\Models\SaleReturn;
use App\Models\PurchaseReturn;
use App\Models\SalePaymentItem;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(): Response
    {
        $request = request();

        // Get period from request or default to current month
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        if ($dateFrom && $dateTo) {
            $periodStart = Carbon::parse($dateFrom)->startOfDay();
            $periodEnd = Carbon::parse($dateTo)->endOfDay();
        } else {
            // Default to current month
            $periodStart = Carbon::now()->startOfMonth();
            $periodEnd = Carbon::now()->endOfMonth();
        }

        // Calculate previous period (same duration)
        $periodDuration = $periodStart->diffInDays($periodEnd) + 1;
        $previousPeriodStart = $periodStart->copy()->subDays($periodDuration);
        $previousPeriodEnd = $periodStart->copy()->subDay();

        $today = Carbon::today();

        // Sales Statistics (using total_after_discount for revenue, not total_amount)
        $todaySales = Sale::whereDate('sale_date', $today)
            ->where('status', 'confirmed')
            ->sum('total_after_discount'); // Revenue without PPN

        $periodSales = Sale::whereBetween('sale_date', [$periodStart, $periodEnd])
            ->where('status', 'confirmed')
            ->sum('total_after_discount'); // Revenue without PPN

        $previousPeriodSales = Sale::whereBetween('sale_date', [$previousPeriodStart, $previousPeriodEnd])
            ->where('status', 'confirmed')
            ->sum('total_after_discount'); // Revenue without PPN

        $todayProfit = Sale::whereDate('sale_date', $today)
            ->where('status', 'confirmed')
            ->sum('total_profit');

        $periodProfit = Sale::whereBetween('sale_date', [$periodStart, $periodEnd])
            ->where('status', 'confirmed')
            ->sum('total_profit');

        // Purchase Statistics
        $todayPurchases = Purchase::whereDate('purchase_date', $today)
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $periodPurchases = Purchase::whereBetween('purchase_date', [$periodStart, $periodEnd])
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $previousPeriodPurchases = Purchase::whereBetween('purchase_date', [$previousPeriodStart, $previousPeriodEnd])
            ->where('status', 'confirmed')
            ->sum('total_amount');

        // Payment Statistics - Optimized with subqueries
        $totalReceivables = DB::table('sales')
            ->leftJoin(DB::raw('(
                SELECT
                    sale_id,
                    SUM(amount) as total_paid
                FROM sale_payment_items
                INNER JOIN sale_payments ON sale_payment_items.sale_payment_id = sale_payments.id
                WHERE sale_payments.status = "confirmed"
                GROUP BY sale_id
            ) as payments'), 'sales.id', '=', 'payments.sale_id')
            ->where('sales.status', 'confirmed')
            ->selectRaw('SUM(GREATEST(0, sales.total_amount - COALESCE(payments.total_paid, 0))) as total_receivables')
            ->value('total_receivables') ?? 0;

        $totalPayables = DB::table('purchases')
            ->leftJoin(DB::raw('(
                SELECT
                    purchase_id,
                    SUM(amount) as total_paid
                FROM purchase_payment_items
                INNER JOIN purchase_payments ON purchase_payment_items.purchase_payment_id = purchase_payments.id
                WHERE purchase_payments.status = "confirmed"
                GROUP BY purchase_id
            ) as payments'), 'purchases.id', '=', 'payments.purchase_id')
            ->where('purchases.status', 'confirmed')
            ->selectRaw('SUM(GREATEST(0, purchases.total_amount - COALESCE(payments.total_paid, 0))) as total_payables')
            ->value('total_payables') ?? 0;

        // Today's Payments
        $todaySalePayments = SalePayment::whereDate('payment_date', $today)
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $todayPurchasePayments = PurchasePayment::whereDate('payment_date', $today)
            ->where('status', 'confirmed')
            ->sum('total_amount');

        // Bank Balances
        $totalBankBalance = Bank::sum('balance');
        $banks = Bank::orderBy('name')->get(['id', 'name', 'type', 'balance']);

        // Low Stock Items (items with stock <= 10)
        $lowStockItems = Item::where('stock', '<=', 10)
            ->orderBy('stock', 'asc')
            ->limit(10)
            ->get(['id', 'name', 'stock']);

        // Recent Transactions
        $recentSales = Sale::with('customer')
            ->orderBy('sale_date', 'desc')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get(['id', 'sale_number', 'customer_id', 'sale_date', 'total_amount', 'status']);

        $recentPurchases = Purchase::with('supplier')
            ->orderBy('purchase_date', 'desc')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get(['id', 'purchase_number', 'supplier_id', 'purchase_date', 'total_amount', 'status']);

        // Upcoming Due Dates (within 30 days) - Optimized with subquery and limit
        $upcomingDueDate = Carbon::now()->addDays(30);

        $salesDueSoon = DB::table('sales')
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->leftJoin(DB::raw('(
                SELECT
                    sale_id,
                    SUM(amount) as total_paid
                FROM sale_payment_items
                INNER JOIN sale_payments ON sale_payment_items.sale_payment_id = sale_payments.id
                WHERE sale_payments.status = "confirmed"
                GROUP BY sale_id
            ) as payments'), 'sales.id', '=', 'payments.sale_id')
            ->where('sales.status', 'confirmed')
            ->whereNotNull('sales.due_date')
            ->where('sales.due_date', '>=', $today)
            ->where('sales.due_date', '<=', $upcomingDueDate)
            ->selectRaw('
                sales.id,
                sales.sale_number,
                sales.sale_date,
                sales.due_date,
                sales.total_amount,
                COALESCE(payments.total_paid, 0) as total_paid,
                GREATEST(0, sales.total_amount - COALESCE(payments.total_paid, 0)) as remaining_amount,
                sales.status,
                customers.id as customer_id,
                customers.name as customer_name
            ')
            ->havingRaw('remaining_amount > 0')
            ->orderBy('sales.due_date', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'customer' => $sale->customer_id ? ['id' => $sale->customer_id, 'name' => $sale->customer_name] : null,
                    'sale_date' => $sale->sale_date,
                    'due_date' => $sale->due_date,
                    'total_amount' => (float) $sale->total_amount,
                    'total_paid' => (float) $sale->total_paid,
                    'remaining_amount' => (float) $sale->remaining_amount,
                    'status' => $sale->status,
                ];
            });

        $purchasesDueSoon = DB::table('purchases')
            ->leftJoin('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->leftJoin(DB::raw('(
                SELECT
                    purchase_id,
                    SUM(amount) as total_paid
                FROM purchase_payment_items
                INNER JOIN purchase_payments ON purchase_payment_items.purchase_payment_id = purchase_payments.id
                WHERE purchase_payments.status = "confirmed"
                GROUP BY purchase_id
            ) as payments'), 'purchases.id', '=', 'payments.purchase_id')
            ->where('purchases.status', 'confirmed')
            ->whereNotNull('purchases.due_date')
            ->where('purchases.due_date', '>=', $today)
            ->where('purchases.due_date', '<=', $upcomingDueDate)
            ->selectRaw('
                purchases.id,
                purchases.purchase_number,
                purchases.purchase_date,
                purchases.due_date,
                purchases.total_amount,
                COALESCE(payments.total_paid, 0) as total_paid,
                GREATEST(0, purchases.total_amount - COALESCE(payments.total_paid, 0)) as remaining_amount,
                purchases.status,
                suppliers.id as supplier_id,
                suppliers.name as supplier_name
            ')
            ->havingRaw('remaining_amount > 0')
            ->orderBy('purchases.due_date', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'purchase_number' => $purchase->purchase_number,
                    'supplier' => $purchase->supplier_id ? ['id' => $purchase->supplier_id, 'name' => $purchase->supplier_name] : null,
                    'purchase_date' => $purchase->purchase_date,
                    'due_date' => $purchase->due_date,
                    'total_amount' => (float) $purchase->total_amount,
                    'total_paid' => (float) $purchase->total_paid,
                    'remaining_amount' => (float) $purchase->remaining_amount,
                    'status' => $purchase->status,
                ];
            });

        // Sales Growth
        $salesGrowth = $previousPeriodSales > 0
            ? (($periodSales - $previousPeriodSales) / $previousPeriodSales) * 100
            : 0;

        // Purchase Growth
        $purchaseGrowth = $previousPeriodPurchases > 0
            ? (($periodPurchases - $previousPeriodPurchases) / $previousPeriodPurchases) * 100
            : 0;

        // Transaction Counts
        $todaySaleCount = Sale::whereDate('sale_date', $today)
            ->where('status', 'confirmed')
            ->count();

        $periodSaleCount = Sale::whereBetween('sale_date', [$periodStart, $periodEnd])
            ->where('status', 'confirmed')
            ->count();

        $todayPurchaseCount = Purchase::whereDate('purchase_date', $today)
            ->where('status', 'confirmed')
            ->count();

        $periodPurchaseCount = Purchase::whereBetween('purchase_date', [$periodStart, $periodEnd])
            ->where('status', 'confirmed')
            ->count();

        $avgSaleValue = $periodSaleCount > 0 ? $periodSales / $periodSaleCount : 0;
        $avgPurchaseValue = $periodPurchaseCount > 0 ? $periodPurchases / $periodPurchaseCount : 0;

        // Profit Margin Percentage
        $profitMarginPercent = $periodSales > 0
            ? ($periodProfit / $periodSales) * 100
            : 0;

        // Top Selling Items (by quantity sold in period)
        // Note: profit calculation in sale_details uses subtotal (after discount), which is correct
        $topSellingItems = SaleDetail::join('sales', 'sale_details.sale_id', '=', 'sales.id')
            ->join('items', 'sale_details.item_id', '=', 'items.id')
            ->whereBetween('sales.sale_date', [$periodStart, $periodEnd])
            ->where('sales.status', 'confirmed')
            ->select(
                'items.id',
                'items.name',
                DB::raw('SUM(sale_details.quantity) as total_quantity'),
                DB::raw('SUM(sale_details.subtotal) as total_revenue'), // Subtotal is after discount (correct for revenue)
                DB::raw('SUM(sale_details.profit) as total_profit')
            )
            ->groupBy('items.id', 'items.name')
            ->orderBy('total_quantity', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'total_quantity' => (float) $item->total_quantity,
                    'total_revenue' => (float) $item->total_revenue,
                    'total_profit' => (float) $item->total_profit,
                ];
            });

        // Top Customers (by sales amount in period) - Optimized
        $topCustomers = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->whereBetween('sales.sale_date', [$periodStart, $periodEnd])
            ->where('sales.status', 'confirmed')
            ->whereNotNull('sales.customer_id')
            ->select(
                'customers.id',
                'customers.name',
                DB::raw('SUM(sales.total_amount) as total_sales'),
                DB::raw('COUNT(*) as transaction_count')
            )
            ->groupBy('customers.id', 'customers.name')
            ->orderBy('total_sales', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                return [
                    'customer' => [
                        'id' => $row->id,
                        'name' => $row->name,
                    ],
                    'total_sales' => (float) $row->total_sales,
                    'transaction_count' => (int) $row->transaction_count,
                ];
            });

        // Inventory Value (using average cost from stock movements)
        $inventoryValue = DB::table('items')
            ->select(DB::raw('SUM(items.stock * COALESCE(avg_costs.avg_cost, 0)) as total_value'))
            ->leftJoin(DB::raw('(
                SELECT
                    item_id,
                    CASE
                        WHEN SUM(remaining_quantity) > 0
                        THEN SUM(unit_cost * remaining_quantity) / SUM(remaining_quantity)
                        ELSE 0
                    END as avg_cost
                FROM stock_movements
                WHERE remaining_quantity > 0
                GROUP BY item_id
            ) as avg_costs'), 'items.id', '=', 'avg_costs.item_id')
            ->where('items.deleted_at', null)
            ->value('total_value') ?? 0;

        // Critical Stock Items (stock < 5)
        $criticalStockItems = Item::where('stock', '<', 5)
            ->where('stock', '>', 0)
            ->orderBy('stock', 'asc')
            ->limit(10)
            ->get(['id', 'name', 'stock']);

        // Dead Stock / Slow-Moving Items (not sold in last 90 days) - Optimized
        $ninetyDaysAgo = Carbon::now()->subDays(90);
        $deadStockItems = DB::table('items')
            ->leftJoin(DB::raw('(
                SELECT
                    item_id,
                    MAX(movement_date) as last_sale_date
                FROM stock_movements
                WHERE reference_type = "Sale"
                GROUP BY item_id
            ) as last_sales'), 'items.id', '=', 'last_sales.item_id')
            ->where('items.stock', '>', 0)
            ->where(function ($query) use ($ninetyDaysAgo) {
                $query->whereNull('last_sales.last_sale_date')
                      ->orWhere('last_sales.last_sale_date', '<', $ninetyDaysAgo);
            })
            ->whereNull('items.deleted_at')
            ->selectRaw('
                items.id,
                items.name,
                items.stock,
                last_sales.last_sale_date,
                DATEDIFF(NOW(), last_sales.last_sale_date) as days_since_last_sale
            ')
            ->orderBy('items.stock', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'stock' => (float) $item->stock,
                    'days_since_last_sale' => $item->last_sale_date ? (int) $item->days_since_last_sale : null,
                ];
            });

        // Return Rate (Sale Returns vs Sales in period)
        $periodSaleReturns = SaleReturn::whereBetween('return_date', [$periodStart, $periodEnd])
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $returnRate = $periodSales > 0
            ? ($periodSaleReturns / $periodSales) * 100
            : 0;

        // Top Suppliers (by purchase amount in period) - Optimized
        $topSuppliers = DB::table('purchases')
            ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->whereBetween('purchases.purchase_date', [$periodStart, $periodEnd])
            ->where('purchases.status', 'confirmed')
            ->whereNotNull('purchases.supplier_id')
            ->select(
                'suppliers.id',
                'suppliers.name',
                DB::raw('SUM(purchases.total_amount) as total_purchases'),
                DB::raw('COUNT(*) as transaction_count')
            )
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderBy('total_purchases', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                return [
                    'supplier' => [
                        'id' => $row->id,
                        'name' => $row->name,
                    ],
                    'total_purchases' => (float) $row->total_purchases,
                    'transaction_count' => (int) $row->transaction_count,
                ];
            });

        // Overdue Receivables (past due date) - Optimized with subquery and limit
        $overdueSales = DB::table('sales')
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->leftJoin(DB::raw('(
                SELECT
                    sale_id,
                    SUM(amount) as total_paid
                FROM sale_payment_items
                INNER JOIN sale_payments ON sale_payment_items.sale_payment_id = sale_payments.id
                WHERE sale_payments.status = "confirmed"
                GROUP BY sale_id
            ) as payments'), 'sales.id', '=', 'payments.sale_id')
            ->where('sales.status', 'confirmed')
            ->whereNotNull('sales.due_date')
            ->where('sales.due_date', '<', $today)
            ->selectRaw('
                sales.id,
                sales.sale_number,
                sales.sale_date,
                sales.due_date,
                sales.total_amount,
                COALESCE(payments.total_paid, 0) as total_paid,
                GREATEST(0, sales.total_amount - COALESCE(payments.total_paid, 0)) as remaining_amount,
                sales.status,
                customers.id as customer_id,
                customers.name as customer_name,
                DATEDIFF(?, sales.due_date) as days_overdue
            ', [$today])
            ->havingRaw('remaining_amount > 0')
            ->orderBy('sales.due_date', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'customer' => $sale->customer_id ? ['id' => $sale->customer_id, 'name' => $sale->customer_name] : null,
                    'sale_date' => $sale->sale_date,
                    'due_date' => $sale->due_date,
                    'total_amount' => (float) $sale->total_amount,
                    'total_paid' => (float) $sale->total_paid,
                    'remaining_amount' => (float) $sale->remaining_amount,
                    'days_overdue' => (int) abs($sale->days_overdue), // Use abs to ensure positive
                    'status' => $sale->status,
                ];
            });

        $totalOverdueAmount = DB::table('sales')
            ->leftJoin(DB::raw('(
                SELECT
                    sale_id,
                    SUM(amount) as total_paid
                FROM sale_payment_items
                INNER JOIN sale_payments ON sale_payment_items.sale_payment_id = sale_payments.id
                WHERE sale_payments.status = "confirmed"
                GROUP BY sale_id
            ) as payments'), 'sales.id', '=', 'payments.sale_id')
            ->where('sales.status', 'confirmed')
            ->whereNotNull('sales.due_date')
            ->where('sales.due_date', '<', $today)
            ->selectRaw('SUM(GREATEST(0, sales.total_amount - COALESCE(payments.total_paid, 0))) as total_overdue')
            ->value('total_overdue') ?? 0;

        // Average Days to Pay (for receivables) - Optimized with subquery
        $avgDaysToPayResult = DB::table('sales')
            ->join(DB::raw('(
                SELECT
                    sale_id,
                    MAX(sale_payments.payment_date) as last_payment_date
                FROM sale_payment_items
                INNER JOIN sale_payments ON sale_payment_items.sale_payment_id = sale_payments.id
                WHERE sale_payments.status = "confirmed"
                GROUP BY sale_id
            ) as last_payments'), 'sales.id', '=', 'last_payments.sale_id')
            ->leftJoin(DB::raw('(
                SELECT
                    sale_id,
                    SUM(amount) as total_paid
                FROM sale_payment_items
                INNER JOIN sale_payments ON sale_payment_items.sale_payment_id = sale_payments.id
                WHERE sale_payments.status = "confirmed"
                GROUP BY sale_id
            ) as payments'), 'sales.id', '=', 'payments.sale_id')
            ->where('sales.status', 'confirmed')
            ->whereNotNull('sales.due_date')
            ->whereRaw('COALESCE(payments.total_paid, 0) >= sales.total_amount')
            ->whereRaw('payments.total_paid > 0')
            ->selectRaw('AVG(DATEDIFF(last_payments.last_payment_date, sales.due_date)) as avg_days')
            ->value('avg_days');

        $avgDaysToPay = $avgDaysToPayResult ? round((float) $avgDaysToPayResult, 1) : 0;

        return Inertia::render('dashboard', [
            'period' => [
                'date_from' => $dateFrom ?: $periodStart->format('Y-m-d'),
                'date_to' => $dateTo ?: $periodEnd->format('Y-m-d'),
            ],
            'stats' => [
                'sales' => [
                    'today' => (float) $todaySales,
                    'period' => (float) $periodSales,
                    'previousPeriod' => (float) $previousPeriodSales,
                    'growth' => round($salesGrowth, 2),
                ],
                'purchases' => [
                    'today' => (float) $todayPurchases,
                    'period' => (float) $periodPurchases,
                    'previousPeriod' => (float) $previousPeriodPurchases,
                    'growth' => round($purchaseGrowth, 2),
                ],
                'profit' => [
                    'today' => (float) $todayProfit,
                    'period' => (float) $periodProfit,
                    'marginPercent' => round($profitMarginPercent, 2),
                ],
                'payments' => [
                    'receivables' => (float) $totalReceivables,
                    'payables' => (float) $totalPayables,
                    'todaySalePayments' => (float) $todaySalePayments,
                    'todayPurchasePayments' => (float) $todayPurchasePayments,
                    'avgDaysToPay' => $avgDaysToPay,
                    'overdueAmount' => (float) $totalOverdueAmount,
                ],
                'bankBalance' => (float) $totalBankBalance,
                'transactions' => [
                    'todaySaleCount' => $todaySaleCount,
                    'periodSaleCount' => $periodSaleCount,
                    'todayPurchaseCount' => $todayPurchaseCount,
                    'periodPurchaseCount' => $periodPurchaseCount,
                    'avgSaleValue' => round($avgSaleValue, 2),
                    'avgPurchaseValue' => round($avgPurchaseValue, 2),
                ],
                'inventoryValue' => (float) $inventoryValue,
                'returnRate' => round($returnRate, 2),
            ],
            'banks' => $banks,
            'lowStockItems' => $lowStockItems,
            'criticalStockItems' => $criticalStockItems,
            'deadStockItems' => $deadStockItems,
            'recentSales' => $recentSales,
            'recentPurchases' => $recentPurchases,
            'salesDueSoon' => $salesDueSoon,
            'overdueSales' => $overdueSales,
            'purchasesDueSoon' => $purchasesDueSoon,
            'topSellingItems' => $topSellingItems,
            'topCustomers' => $topCustomers,
            'topSuppliers' => $topSuppliers,
        ]);
    }
}

