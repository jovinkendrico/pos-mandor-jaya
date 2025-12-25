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

class MarginByItemReportController extends Controller
{
    /**
     * Display margin analysis by item report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get margin analysis per item
        $marginData = DB::table('sale_details')
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
                DB::raw('AVG(sale_details.price) as avg_selling_price'),
                DB::raw('AVG(sale_details.cost / NULLIF(sale_details.quantity, 0)) as avg_cost_price')
            )
            ->groupBy('items.id', 'items.code', 'items.name')
            ->havingRaw('SUM(sale_details.subtotal) > 0')
            ->get()
            ->map(function ($row) {
                $profitMargin = $row->total_revenue > 0
                    ? ($row->total_profit / $row->total_revenue) * 100
                    : 0;

                $markup = $row->avg_cost_price > 0
                    ? (($row->avg_selling_price - $row->avg_cost_price) / $row->avg_cost_price) * 100
                    : 0;

                return [
                    'item_id' => $row->item_id,
                    'item_code' => $row->item_code,
                    'item_name' => $row->item_name,
                    'total_quantity' => (float) $row->total_quantity,
                    'transaction_count' => (int) $row->transaction_count,
                    'total_revenue' => (float) $row->total_revenue,
                    'total_cost' => (float) $row->total_cost,
                    'total_profit' => (float) $row->total_profit,
                    'avg_selling_price' => (float) $row->avg_selling_price,
                    'avg_cost_price' => (float) ($row->avg_cost_price ?? 0),
                    'profit_margin' => (float) $profitMargin,
                    'markup_percent' => (float) $markup,
                    'profit_per_unit' => (float) ($row->total_quantity > 0 ? $row->total_profit / $row->total_quantity : 0),
                ];
            })
            ->sortByDesc('total_profit')
            ->values();

        // Calculate summary
        $summary = [
            'total_items' => $marginData->count(),
            'total_revenue' => $marginData->sum('total_revenue'),
            'total_cost' => $marginData->sum('total_cost'),
            'total_profit' => $marginData->sum('total_profit'),
        ];

        $summary['avg_profit_margin'] = $summary['total_revenue'] > 0
            ? ($summary['total_profit'] / $summary['total_revenue']) * 100
            : 0;

        // Top profitable items
        $topProfitable = $marginData->take(10)->values();

        // Least profitable items (but still profitable)
        $leastProfitable = $marginData->filter(function ($item) {
            return $item['total_profit'] > 0;
        })->sortBy('profit_margin')->take(10)->values();

        // Negative margin items (losing money)
        $negativeMargin = $marginData->filter(function ($item) {
            return $item['total_profit'] < 0 || $item['profit_margin'] < 0;
        })->sortBy('profit_margin')->values();

        return Inertia::render('reports/margin-by-item/index', [
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
     * Print margin by item report as PDF
     */
    public function print(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));

            $marginData = DB::table('sale_details')
                ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
                ->join('items', 'sale_details.item_id', '=', 'items.id')
                ->where('sales.status', 'confirmed')
                ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
                ->select(
                    'items.code as item_code',
                    'items.name as item_name',
                    DB::raw('SUM(sale_details.subtotal) as total_revenue'),
                    DB::raw('SUM(sale_details.cost) as total_cost'),
                    DB::raw('SUM(sale_details.profit) as total_profit')
                )
                ->groupBy('items.id', 'items.code', 'items.name')
                ->havingRaw('SUM(sale_details.subtotal) > 0')
                ->get()
                ->map(function ($row) {
                    $profitMargin = $row->total_revenue > 0
                        ? ($row->total_profit / $row->total_revenue) * 100
                        : 0;

                    return [
                        'item_code' => $row->item_code,
                        'item_name' => $row->item_name,
                        'total_revenue' => (float) $row->total_revenue,
                        'total_cost' => (float) $row->total_cost,
                        'total_profit' => (float) $row->total_profit,
                        'profit_margin' => (float) $profitMargin,
                    ];
                })
                ->sortByDesc('total_profit')
                ->values();

            $summary = [
                'total_items' => $marginData->count(),
                'total_revenue' => $marginData->sum('total_revenue'),
                'total_profit' => $marginData->sum('total_profit'),
            ];

            $pdf = Pdf::loadView('pdf.reports.margin-by-item', [
                'title' => 'Laporan Analisis Margin per Item',
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'summary' => $summary,
                'marginData' => $marginData,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-margin-per-item-' . $dateFrom . '-to-' . $dateTo . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Margin By Item Report - Exception caught', [
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
