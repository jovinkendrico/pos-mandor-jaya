<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SaleByCustomerReportController extends Controller
{
    /**
     * Display sale by customer report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get sales grouped by customer
        $customerSales = DB::table('sales')
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->where('sales.status', 'confirmed')
            ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
            ->select(
                'customers.id as customer_id',
                'customers.name as customer_name',
                DB::raw('COUNT(sales.id) as transaction_count'),
                DB::raw('SUM(sales.total_after_discount) as total_sales'),
                DB::raw('SUM(sales.total_amount) as total_amount'),
                DB::raw('SUM(sales.total_cost) as total_cost'),
                DB::raw('SUM(sales.total_profit) as total_profit'),
                DB::raw('SUM(sales.discount1_amount + sales.discount2_amount) as total_discount'),
                DB::raw('SUM(sales.ppn_amount) as total_ppn')
            )
            ->groupBy('customers.id', 'customers.name')
            ->orderBy('total_sales', 'desc')
            ->get()
            ->map(function ($row) {
                $profitMargin = $row->total_sales > 0 
                    ? ($row->total_profit / $row->total_sales) * 100 
                    : 0;
                
                return [
                    'customer_id' => $row->customer_id,
                    'customer_name' => $row->customer_name ?: 'No Customer',
                    'transaction_count' => (int) $row->transaction_count,
                    'total_sales' => (float) $row->total_sales,
                    'total_amount' => (float) $row->total_amount,
                    'total_cost' => (float) $row->total_cost,
                    'total_profit' => (float) $row->total_profit,
                    'total_discount' => (float) $row->total_discount,
                    'total_ppn' => (float) $row->total_ppn,
                    'profit_margin' => (float) $profitMargin,
                    'avg_sale_value' => (float) ($row->transaction_count > 0 ? $row->total_sales / $row->transaction_count : 0),
                ];
            });

        // Calculate totals
        $summary = [
            'total_customers' => $customerSales->count(),
            'total_transactions' => $customerSales->sum('transaction_count'),
            'total_sales' => $customerSales->sum('total_sales'),
            'total_amount' => $customerSales->sum('total_amount'),
            'total_cost' => $customerSales->sum('total_cost'),
            'total_profit' => $customerSales->sum('total_profit'),
            'total_discount' => $customerSales->sum('total_discount'),
            'total_ppn' => $customerSales->sum('total_ppn'),
        ];

        $summary['profit_margin'] = $summary['total_sales'] > 0 
            ? ($summary['total_profit'] / $summary['total_sales']) * 100 
            : 0;
        $summary['avg_sale_value'] = $summary['total_transactions'] > 0 
            ? $summary['total_sales'] / $summary['total_transactions'] 
            : 0;

        return Inertia::render('reports/sale-by-customer/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'summary' => $summary,
            'customerSales' => $customerSales,
        ]);
    }
}
