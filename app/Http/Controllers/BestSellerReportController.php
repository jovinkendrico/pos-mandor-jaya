<?php

namespace App\Http\Controllers;

use App\Models\SaleDetail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class BestSellerReportController extends Controller
{
    /**
     * Display best seller report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $sortBy = $request->get('sort_by', 'quantity'); // quantity or revenue
        $limit = $request->get('limit', 50); // Top 50

        // Get best selling items
        $bestSellers = DB::table('sale_details')
            ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
            ->join('items', 'sale_details.item_id', '=', 'items.id')
            ->where('sales.status', 'confirmed')
            ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
            ->select(
                'items.id as item_id',
                'items.code as item_code',
                'items.name as item_name',
                DB::raw('SUM(sale_details.quantity) as total_quantity'),
                DB::raw('COUNT(DISTINCT sales.id) as transaction_count'),
                DB::raw('SUM(sale_details.subtotal) as total_revenue'),
                DB::raw('SUM(sale_details.cost) as total_cost'),
                DB::raw('SUM(sale_details.profit) as total_profit'),
                DB::raw('AVG(sale_details.price) as avg_price'),
                DB::raw('AVG(sale_details.cost / NULLIF(sale_details.quantity, 0)) as avg_cost')
            )
            ->groupBy('items.id', 'items.code', 'items.name')
            ->orderByRaw($sortBy === 'revenue' ? 'SUM(sale_details.subtotal) DESC' : 'SUM(sale_details.quantity) DESC')
            ->limit($limit)
            ->get()
            ->map(function ($row, $index) {
                $profitMargin = $row->total_revenue > 0
                    ? ($row->total_profit / $row->total_revenue) * 100
                    : 0;

                return [
                    'rank' => $index + 1,
                    'item_id' => $row->item_id,
                    'item_code' => $row->item_code,
                    'item_name' => $row->item_name,
                    'total_quantity' => (float) $row->total_quantity,
                    'transaction_count' => (int) $row->transaction_count,
                    'total_revenue' => (float) $row->total_revenue,
                    'total_cost' => (float) $row->total_cost,
                    'total_profit' => (float) $row->total_profit,
                    'avg_price' => (float) $row->avg_price,
                    'avg_cost' => (float) ($row->avg_cost ?? 0),
                    'profit_margin' => (float) $profitMargin,
                ];
            });

        // Calculate summary
        $summary = [
            'total_items' => $bestSellers->count(),
            'total_quantity' => $bestSellers->sum('total_quantity'),
            'total_revenue' => $bestSellers->sum('total_revenue'),
            'total_profit' => $bestSellers->sum('total_profit'),
        ];

        $summary['profit_margin'] = $summary['total_revenue'] > 0
            ? ($summary['total_profit'] / $summary['total_revenue']) * 100
            : 0;

        // Get trend data (daily sales for top 10 items)
        $topItems = $bestSellers->take(10)->pluck('item_id');
        $trendData = [];

        if ($topItems->isNotEmpty()) {
            $dailySales = DB::table('sale_details')
                ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
                ->where('sales.status', 'confirmed')
                ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
                ->whereIn('sale_details.item_id', $topItems)
                ->select(
                    'sale_details.item_id',
                    DB::raw('DATE(sales.sale_date) as sale_date'),
                    DB::raw('SUM(sale_details.quantity) as quantity'),
                    DB::raw('SUM(sale_details.subtotal) as revenue')
                )
                ->groupBy('sale_details.item_id', DB::raw('DATE(sales.sale_date)'))
                ->orderBy('sale_date', 'asc')
                ->get()
                ->groupBy('item_id');

            foreach ($topItems as $itemId) {
                $item = $bestSellers->firstWhere('item_id', $itemId);
                if ($item) {
                    $trendData[] = [
                        'item_id' => $itemId,
                        'item_code' => $item['item_code'],
                        'item_name' => $item['item_name'],
                        'daily_data' => $dailySales->get($itemId, collect())->map(function ($day) {
                            return [
                                'date' => $day->sale_date,
                                'quantity' => (float) $day->quantity,
                                'revenue' => (float) $day->revenue,
                            ];
                        })->values(),
                    ];
                }
            }
        }

        return Inertia::render('reports/best-seller/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'sortBy' => $sortBy,
            'limit' => $limit,
            'summary' => $summary,
            'bestSellers' => $bestSellers,
            'trendData' => $trendData,
        ]);
    }

    /**
     * Print best seller report as PDF
     */
    public function print(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));
            $sortBy = $request->get('sort_by', 'quantity');
            $limit = $request->get('limit', 50);

            $bestSellers = DB::table('sale_details')
                ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
                ->join('items', 'sale_details.item_id', '=', 'items.id')
                ->where('sales.status', 'confirmed')
                ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
                ->select(
                    'items.id as item_id',
                    'items.code as item_code',
                    'items.name as item_name',
                    DB::raw('SUM(sale_details.quantity) as total_quantity'),
                    DB::raw('COUNT(DISTINCT sales.id) as transaction_count'),
                    DB::raw('SUM(sale_details.subtotal) as total_revenue'),
                    DB::raw('SUM(sale_details.profit) as total_profit')
                )
                ->groupBy('items.id', 'items.code', 'items.name')
                ->orderByRaw($sortBy === 'revenue' ? 'SUM(sale_details.subtotal) DESC' : 'SUM(sale_details.quantity) DESC')
                ->limit($limit)
                ->get()
                ->map(function ($row, $index) {
                    return [
                        'rank' => $index + 1,
                        'item_code' => $row->item_code,
                        'item_name' => $row->item_name,
                        'total_quantity' => (float) $row->total_quantity,
                        'total_revenue' => (float) $row->total_revenue,
                        'total_profit' => (float) $row->total_profit,
                    ];
                });

            $summary = [
                'total_items' => $bestSellers->count(),
                'total_quantity' => $bestSellers->sum('total_quantity'),
                'total_revenue' => $bestSellers->sum('total_revenue'),
            ];

            $pdf = Pdf::loadView('pdf.reports.best-seller', [
                'title' => 'Laporan Barang Paling Laku',
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'summary' => $summary,
                'bestSellers' => $bestSellers,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-barang-paling-laku-' . $dateFrom . '-to-' . $dateTo . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Best Seller Report - Exception caught', [
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
