<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class MarginByCustomerReportController extends Controller
{
    /**
     * Display margin analysis by customer report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get margin analysis per customer
        $marginData = DB::table('sales')
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->where('sales.status', 'confirmed')
            ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
            ->select(
                'customers.id as customer_id',
                'customers.name as customer_name',
                DB::raw('COUNT(sales.id) as transaction_count'),
                DB::raw('SUM(sales.total_after_discount) as total_revenue'),
                DB::raw('SUM(sales.total_cost) as total_cost'),
                DB::raw('SUM(sales.total_profit) as total_profit'),
                DB::raw('SUM(sales.discount1_amount + sales.discount2_amount) as total_discount'),
                DB::raw('AVG(sales.total_after_discount) as avg_sale_value')
            )
            ->groupBy('customers.id', 'customers.name')
            ->havingRaw('SUM(sales.total_after_discount) > 0')
            ->get()
            ->map(function ($row) {
                $profitMargin = $row->total_revenue > 0 
                    ? ($row->total_profit / $row->total_revenue) * 100 
                    : 0;
                
                return [
                    'customer_id' => $row->customer_id,
                    'customer_name' => $row->customer_name ?: 'No Customer',
                    'transaction_count' => (int) $row->transaction_count,
                    'total_revenue' => (float) $row->total_revenue,
                    'total_cost' => (float) $row->total_cost,
                    'total_profit' => (float) $row->total_profit,
                    'total_discount' => (float) $row->total_discount,
                    'avg_sale_value' => (float) $row->avg_sale_value,
                    'profit_margin' => (float) $profitMargin,
                    'profit_per_transaction' => (float) ($row->transaction_count > 0 ? $row->total_profit / $row->transaction_count : 0),
                ];
            })
            ->sortByDesc('total_profit')
            ->values();

        // Calculate summary
        $summary = [
            'total_customers' => $marginData->count(),
            'total_revenue' => $marginData->sum('total_revenue'),
            'total_cost' => $marginData->sum('total_cost'),
            'total_profit' => $marginData->sum('total_profit'),
            'total_discount' => $marginData->sum('total_discount'),
        ];

        $summary['avg_profit_margin'] = $summary['total_revenue'] > 0 
            ? ($summary['total_profit'] / $summary['total_revenue']) * 100 
            : 0;

        // Top profitable customers
        $topProfitable = $marginData->take(10)->values();

        // Least profitable customers (but still profitable)
        $leastProfitable = $marginData->filter(function ($customer) {
            return $customer['total_profit'] > 0;
        })->sortBy('profit_margin')->take(10)->values();

        // Negative margin customers (losing money)
        $negativeMargin = $marginData->filter(function ($customer) {
            return $customer['total_profit'] < 0 || $customer['profit_margin'] < 0;
        })->sortBy('profit_margin')->values();

        return Inertia::render('reports/margin-by-customer/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'summary' => $summary,
            'marginData' => $marginData,
            'topProfitable' => $topProfitable,
            'leastProfitable' => $leastProfitable,
            'negativeMargin' => $negativeMargin,
        ]);
    }

    /**
     * Print margin by customer report as PDF
     */
    public function print(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));

            $marginData = DB::table('sales')
                ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
                ->where('sales.status', 'confirmed')
                ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
                ->select(
                    'customers.name as customer_name',
                    DB::raw('COUNT(sales.id) as transaction_count'),
                    DB::raw('SUM(sales.total_after_discount) as total_revenue'),
                    DB::raw('SUM(sales.total_cost) as total_cost'),
                    DB::raw('SUM(sales.total_profit) as total_profit')
                )
                ->groupBy('customers.id', 'customers.name')
                ->havingRaw('SUM(sales.total_after_discount) > 0')
                ->get()
                ->map(function ($row) {
                    $profitMargin = $row->total_revenue > 0 
                        ? ($row->total_profit / $row->total_revenue) * 100 
                        : 0;
                    
                    return [
                        'customer_name' => $row->customer_name ?: 'No Customer',
                        'transaction_count' => (int) $row->transaction_count,
                        'total_revenue' => (float) $row->total_revenue,
                        'total_cost' => (float) $row->total_cost,
                        'total_profit' => (float) $row->total_profit,
                        'profit_margin' => (float) $profitMargin,
                    ];
                })
                ->sortByDesc('total_profit')
                ->values();

            $summary = [
                'total_customers' => $marginData->count(),
                'total_revenue' => $marginData->sum('total_revenue'),
                'total_profit' => $marginData->sum('total_profit'),
            ];

            $pdf = Pdf::loadView('pdf.reports.margin-by-customer', [
                'title' => 'Laporan Analisis Margin per Customer',
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'summary' => $summary,
                'marginData' => $marginData,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-margin-per-customer-' . $dateFrom . '-to-' . $dateTo . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Margin By Customer Report - Exception caught', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return back()->withErrors([
                'message' => 'Error generating PDF: ' . $e->getMessage(),
            ]);
        }
    }
}
