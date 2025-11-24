<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SaleReportController extends Controller
{
    /**
     * Display sale report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get sales data
        $sales = Sale::with('customer')
            ->where('status', 'confirmed')
            ->whereBetween('sale_date', [$dateFrom, $dateTo])
            ->orderBy('sale_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        // Calculate totals
        $totalSales = $sales->sum('total_after_discount'); // Revenue without PPN
        $totalPPN = $sales->sum('ppn_amount');
        $totalAmount = $sales->sum('total_amount');
        $totalDiscount = $sales->sum('discount1_amount') + $sales->sum('discount2_amount');
        $totalCost = $sales->sum('total_cost');
        $totalProfit = $sales->sum('total_profit');
        $totalTransactions = $sales->count();

        // Group by date for daily summary
        $dailySummary = $sales->groupBy(function ($sale) {
            return Carbon::parse($sale->sale_date)->format('Y-m-d');
        })->map(function ($daySales) {
            return [
                'date' => Carbon::parse($daySales->first()->sale_date)->format('Y-m-d'),
                'date_formatted' => Carbon::parse($daySales->first()->sale_date)->format('d M Y'),
                'count' => $daySales->count(),
                'total_sales' => $daySales->sum('total_after_discount'),
                'total_ppn' => $daySales->sum('ppn_amount'),
                'total_amount' => $daySales->sum('total_amount'),
                'total_discount' => $daySales->sum('discount1_amount') + $daySales->sum('discount2_amount'),
                'total_cost' => $daySales->sum('total_cost'),
                'total_profit' => $daySales->sum('total_profit'),
            ];
        })->values();

        // Group by customer
        $customerSummary = $sales->groupBy('customer_id')->map(function ($customerSales, $customerId) {
            $customer = $customerSales->first()->customer;
            return [
                'customer_id' => $customerId,
                'customer_name' => $customer ? $customer->name : 'No Customer',
                'count' => $customerSales->count(),
                'total_sales' => $customerSales->sum('total_after_discount'),
                'total_amount' => $customerSales->sum('total_amount'),
                'total_profit' => $customerSales->sum('total_profit'),
            ];
        })->sortByDesc('total_sales')->values();

        // Profit margin
        $profitMargin = $totalSales > 0 ? ($totalProfit / $totalSales) * 100 : 0;
        $avgSaleValue = $totalTransactions > 0 ? $totalSales / $totalTransactions : 0;
        $avgProfit = $totalTransactions > 0 ? $totalProfit / $totalTransactions : 0;

        return Inertia::render('reports/sale-report/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'summary' => [
                'total_sales' => $totalSales,
                'total_ppn' => $totalPPN,
                'total_amount' => $totalAmount,
                'total_discount' => $totalDiscount,
                'total_cost' => $totalCost,
                'total_profit' => $totalProfit,
                'total_transactions' => $totalTransactions,
                'profit_margin' => $profitMargin,
                'avg_sale_value' => $avgSaleValue,
                'avg_profit' => $avgProfit,
            ],
            'dailySummary' => $dailySummary,
            'customerSummary' => $customerSummary,
            'sales' => $sales->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'sale_date' => $sale->sale_date,
                    'customer_name' => $sale->customer ? $sale->customer->name : 'No Customer',
                    'total_after_discount' => (float) $sale->total_after_discount,
                    'discount1_amount' => (float) $sale->discount1_amount,
                    'discount2_amount' => (float) $sale->discount2_amount,
                    'ppn_amount' => (float) $sale->ppn_amount,
                    'total_amount' => (float) $sale->total_amount,
                    'total_cost' => (float) $sale->total_cost,
                    'total_profit' => (float) $sale->total_profit,
                ];
            }),
        ]);
    }
}
