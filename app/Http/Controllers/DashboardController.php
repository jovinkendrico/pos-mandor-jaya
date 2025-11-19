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
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();

        // Sales Statistics
        $todaySales = Sale::whereDate('sale_date', $today)
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $monthSales = Sale::where('sale_date', '>=', $thisMonth)
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $lastMonthSales = Sale::whereBetween('sale_date', [$lastMonth, $lastMonthEnd])
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $todayProfit = Sale::whereDate('sale_date', $today)
            ->where('status', 'confirmed')
            ->sum('total_profit');

        $monthProfit = Sale::where('sale_date', '>=', $thisMonth)
            ->where('status', 'confirmed')
            ->sum('total_profit');

        // Purchase Statistics
        $todayPurchases = Purchase::whereDate('purchase_date', $today)
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $monthPurchases = Purchase::where('purchase_date', '>=', $thisMonth)
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $lastMonthPurchases = Purchase::whereBetween('purchase_date', [$lastMonth, $lastMonthEnd])
            ->where('status', 'confirmed')
            ->sum('total_amount');

        // Payment Statistics
        $totalReceivables = Sale::where('status', 'confirmed')
            ->get()
            ->append(['total_paid', 'remaining_amount'])
            ->sum(function ($sale) {
                return max(0, (float) $sale->remaining_amount);
            });

        $totalPayables = Purchase::where('status', 'confirmed')
            ->get()
            ->append(['total_paid', 'remaining_amount'])
            ->sum(function ($purchase) {
                return max(0, (float) $purchase->remaining_amount);
            });

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

        // Upcoming Due Dates (within 30 days)
        $upcomingDueDate = Carbon::now()->addDays(30);

        $salesDueSoon = Sale::with('customer')
            ->where('status', 'confirmed')
            ->whereNotNull('due_date')
            ->where('due_date', '>=', $today)
            ->where('due_date', '<=', $upcomingDueDate)
            ->get()
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($sale) {
                return $sale->remaining_amount > 0;
            })
            ->sortBy('due_date')
            ->take(10)
            ->values()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'customer' => $sale->customer,
                    'sale_date' => $sale->sale_date,
                    'due_date' => $sale->due_date,
                    'total_amount' => (float) $sale->total_amount,
                    'total_paid' => (float) $sale->total_paid,
                    'remaining_amount' => (float) $sale->remaining_amount,
                    'status' => $sale->status,
                ];
            });

        $purchasesDueSoon = Purchase::with('supplier')
            ->where('status', 'confirmed')
            ->whereNotNull('due_date')
            ->where('due_date', '>=', $today)
            ->where('due_date', '<=', $upcomingDueDate)
            ->get()
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($purchase) {
                return $purchase->remaining_amount > 0;
            })
            ->sortBy('due_date')
            ->take(10)
            ->values()
            ->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'purchase_number' => $purchase->purchase_number,
                    'supplier' => $purchase->supplier,
                    'purchase_date' => $purchase->purchase_date,
                    'due_date' => $purchase->due_date,
                    'total_amount' => (float) $purchase->total_amount,
                    'total_paid' => (float) $purchase->total_paid,
                    'remaining_amount' => (float) $purchase->remaining_amount,
                    'status' => $purchase->status,
                ];
            });

        // Sales Growth
        $salesGrowth = $lastMonthSales > 0
            ? (($monthSales - $lastMonthSales) / $lastMonthSales) * 100
            : 0;

        // Purchase Growth
        $purchaseGrowth = $lastMonthPurchases > 0
            ? (($monthPurchases - $lastMonthPurchases) / $lastMonthPurchases) * 100
            : 0;

        // Transaction Counts
        $todaySaleCount = Sale::whereDate('sale_date', $today)
            ->where('status', 'confirmed')
            ->count();

        $monthSaleCount = Sale::where('sale_date', '>=', $thisMonth)
            ->where('status', 'confirmed')
            ->count();

        $todayPurchaseCount = Purchase::whereDate('purchase_date', $today)
            ->where('status', 'confirmed')
            ->count();

        $monthPurchaseCount = Purchase::where('purchase_date', '>=', $thisMonth)
            ->where('status', 'confirmed')
            ->count();

        $avgSaleValue = $monthSaleCount > 0 ? $monthSales / $monthSaleCount : 0;
        $avgPurchaseValue = $monthPurchaseCount > 0 ? $monthPurchases / $monthPurchaseCount : 0;

        // Profit Margin Percentage
        $profitMarginPercent = $monthSales > 0
            ? ($monthProfit / $monthSales) * 100
            : 0;

        // Top Selling Items (by quantity sold this month)
        $topSellingItems = SaleDetail::join('sales', 'sale_details.sale_id', '=', 'sales.id')
            ->join('items', 'sale_details.item_id', '=', 'items.id')
            ->where('sales.sale_date', '>=', $thisMonth)
            ->where('sales.status', 'confirmed')
            ->select(
                'items.id',
                'items.name',
                DB::raw('SUM(sale_details.quantity) as total_quantity'),
                DB::raw('SUM(sale_details.subtotal) as total_revenue'),
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

        // Top Customers (by sales amount this month)
        $topCustomers = Sale::with('customer')
            ->where('sale_date', '>=', $thisMonth)
            ->where('status', 'confirmed')
            ->whereNotNull('customer_id')
            ->select('customer_id', DB::raw('SUM(total_amount) as total_sales'), DB::raw('COUNT(*) as transaction_count'))
            ->groupBy('customer_id')
            ->orderBy('total_sales', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($sale) {
                return [
                    'customer' => $sale->customer,
                    'total_sales' => (float) $sale->total_sales,
                    'transaction_count' => (int) $sale->transaction_count,
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

        // Dead Stock / Slow-Moving Items (not sold in last 90 days)
        $ninetyDaysAgo = Carbon::now()->subDays(90);
        $deadStockItems = Item::where('stock', '>', 0)
            ->whereDoesntHave('stockMovements', function ($query) use ($ninetyDaysAgo) {
                $query->where('reference_type', 'Sale')
                    ->where('movement_date', '>=', $ninetyDaysAgo);
            })
            ->orderBy('stock', 'desc')
            ->limit(10)
            ->get(['id', 'name', 'stock'])
            ->map(function ($item) use ($ninetyDaysAgo) {
                // Get last sale date
                $lastSale = StockMovement::where('item_id', $item->id)
                    ->where('reference_type', 'Sale')
                    ->orderBy('movement_date', 'desc')
                    ->first();

                $daysSinceLastSale = $lastSale
                    ? Carbon::parse($lastSale->movement_date)->diffInDays(Carbon::now())
                    : null;

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'stock' => (float) $item->stock,
                    'days_since_last_sale' => $daysSinceLastSale,
                ];
            });

        // Return Rate (Sale Returns vs Sales this month)
        $monthSaleReturns = SaleReturn::where('return_date', '>=', $thisMonth)
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $returnRate = $monthSales > 0
            ? ($monthSaleReturns / $monthSales) * 100
            : 0;

        // Top Suppliers (by purchase amount this month)
        $topSuppliers = Purchase::with('supplier')
            ->where('purchase_date', '>=', $thisMonth)
            ->where('status', 'confirmed')
            ->whereNotNull('supplier_id')
            ->select('supplier_id', DB::raw('SUM(total_amount) as total_purchases'), DB::raw('COUNT(*) as transaction_count'))
            ->groupBy('supplier_id')
            ->orderBy('total_purchases', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($purchase) {
                return [
                    'supplier' => $purchase->supplier,
                    'total_purchases' => (float) $purchase->total_purchases,
                    'transaction_count' => (int) $purchase->transaction_count,
                ];
            });

        // Overdue Receivables (past due date)
        $overdueSales = Sale::with('customer')
            ->where('status', 'confirmed')
            ->whereNotNull('due_date')
            ->where('due_date', '<', $today)
            ->get()
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($sale) {
                return $sale->remaining_amount > 0;
            })
            ->sortBy('due_date')
            ->take(10)
            ->values()
            ->map(function ($sale) use ($today) {
                $dueDate = Carbon::parse($sale->due_date)->startOfDay();
                $todayDate = Carbon::parse($today)->startOfDay();
                $daysOverdue = (int) $dueDate->diffInDays($todayDate, false);
                return [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'customer' => $sale->customer,
                    'sale_date' => $sale->sale_date,
                    'due_date' => $sale->due_date,
                    'total_amount' => (float) $sale->total_amount,
                    'total_paid' => (float) $sale->total_paid,
                    'remaining_amount' => (float) $sale->remaining_amount,
                    'days_overdue' => $daysOverdue,
                    'status' => $sale->status,
                ];
            });

        $totalOverdueAmount = collect($overdueSales)->sum('remaining_amount');

        // Average Days to Pay (for receivables)
        $paidSales = Sale::where('status', 'confirmed')
            ->whereNotNull('due_date')
            ->get()
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($sale) {
                return $sale->remaining_amount == 0 && $sale->total_paid > 0;
            });

        $totalDays = 0;
        $paidCount = 0;

        foreach ($paidSales as $sale) {
            $lastPaymentItem = SalePaymentItem::where('sale_id', $sale->id)
                ->with('salePayment')
                ->whereHas('salePayment', function ($query) {
                    $query->where('status', 'confirmed');
                })
                ->orderBy('created_at', 'desc')
                ->first();

            if ($lastPaymentItem && $lastPaymentItem->salePayment && $sale->due_date) {
                $paymentDate = Carbon::parse($lastPaymentItem->salePayment->payment_date);
                $dueDate = Carbon::parse($sale->due_date);
                $daysToPay = $dueDate->diffInDays($paymentDate);
                $totalDays += $daysToPay;
                $paidCount++;
            }
        }

        $avgDaysToPay = $paidCount > 0 ? round($totalDays / $paidCount, 1) : 0;

        return Inertia::render('dashboard', [
            'stats' => [
                'sales' => [
                    'today' => (float) $todaySales,
                    'month' => (float) $monthSales,
                    'lastMonth' => (float) $lastMonthSales,
                    'growth' => round($salesGrowth, 2),
                ],
                'purchases' => [
                    'today' => (float) $todayPurchases,
                    'month' => (float) $monthPurchases,
                    'lastMonth' => (float) $lastMonthPurchases,
                    'growth' => round($purchaseGrowth, 2),
                ],
                'profit' => [
                    'today' => (float) $todayProfit,
                    'month' => (float) $monthProfit,
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
                    'monthSaleCount' => $monthSaleCount,
                    'todayPurchaseCount' => $todayPurchaseCount,
                    'monthPurchaseCount' => $monthPurchaseCount,
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

