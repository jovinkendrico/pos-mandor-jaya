<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\SaleDetail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class StockTurnoverReportController extends Controller
{
    /**
     * Display stock turnover report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfYear()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get all items with stock movements
        $items = Item::with('itemUoms.uom')
            ->where('stock', '>', 0)
            ->get();

        $itemIds = $items->pluck('id')->toArray();
        $totalDays = Carbon::parse($dateFrom)->diffInDays(Carbon::parse($dateTo)) + 1;

        // Bulk query: Get total sales quantity for all items in one query
        $salesData = DB::table('sale_details')
            ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
            ->whereIn('sale_details.item_id', $itemIds)
            ->where('sales.status', 'confirmed')
            ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
            ->select('sale_details.item_id', DB::raw('SUM(sale_details.quantity) as total_sales'))
            ->groupBy('sale_details.item_id')
            ->pluck('total_sales', 'item_id')
            ->toArray();

        // Bulk query: Get average cost for all items in one query
        $costData = DB::table('stock_movements')
            ->whereIn('item_id', $itemIds)
            ->where('remaining_quantity', '>', 0)
            ->select('item_id')
            ->selectRaw('
                CASE
                    WHEN SUM(remaining_quantity) > 0
                    THEN SUM(unit_cost * remaining_quantity) / SUM(remaining_quantity)
                    ELSE 0
                END as avg_cost
            ')
            ->groupBy('item_id')
            ->pluck('avg_cost', 'item_id')
            ->toArray();

        $turnoverData = [];
        foreach ($items as $item) {
            // Get total sales quantity from bulk query result
            $totalSales = (float) ($salesData[$item->id] ?? 0);

            // Get average stock in period (simplified: use current stock)
            $avgStock = (float) $item->stock;

            // Get average cost from bulk query result
            $avgCost = (float) ($costData[$item->id] ?? 0);

            // Stock Turnover Ratio = Cost of Goods Sold / Average Inventory
            // Simplified: Total Sales Quantity / Average Stock
            $turnoverRatio = $avgStock > 0 ? $totalSales / $avgStock : 0;

            // Days to Turnover = Period Days / Turnover Ratio
            $daysToTurnover = $turnoverRatio > 0 ? $totalDays / $turnoverRatio : 0;

            // Categorize turnover speed
            $turnoverCategory = 'slow';
            if ($turnoverRatio >= 12) {
                $turnoverCategory = 'fast'; // 12+ times per year
            } elseif ($turnoverRatio >= 6) {
                $turnoverCategory = 'medium'; // 6-12 times per year
            }

            $baseUom = $item->itemUoms->where('is_base', true)->first();
            $unitName = $baseUom && $baseUom->uom ? $baseUom->uom->name : '-';

            $turnoverData[] = [
                'item_id' => $item->id,
                'item_code' => $item->code,
                'item_name' => $item->name,
                'stock' => (float) $item->stock,
                'unit' => $unitName,
                'total_sales' => $totalSales,
                'avg_stock' => $avgStock,
                'avg_cost' => $avgCost,
                'stock_value' => $avgStock * $avgCost,
                'turnover_ratio' => (float) $turnoverRatio,
                'days_to_turnover' => (float) $daysToTurnover,
                'turnover_category' => $turnoverCategory,
            ];
        }

        // Sort by turnover ratio (descending)
        usort($turnoverData, function ($a, $b) {
            return $b['turnover_ratio'] <=> $a['turnover_ratio'];
        });

        // Summary by category
        $fastMoving = collect($turnoverData)->where('turnover_category', 'fast');
        $mediumMoving = collect($turnoverData)->where('turnover_category', 'medium');
        $slowMoving = collect($turnoverData)->where('turnover_category', 'slow');

        $summary = [
            'total_items' => count($turnoverData),
            'fast_moving_count' => $fastMoving->count(),
            'medium_moving_count' => $mediumMoving->count(),
            'slow_moving_count' => $slowMoving->count(),
            'avg_turnover_ratio' => count($turnoverData) > 0
                ? collect($turnoverData)->avg('turnover_ratio')
                : 0,
            'total_stock_value' => collect($turnoverData)->sum('stock_value'),
        ];

        return Inertia::render('reports/stock-turnover/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'summary' => $summary,
            'turnoverData' => $turnoverData,
        ]);
    }

    /**
     * Print stock turnover report as PDF
     */
    public function print(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->startOfYear()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));

            $items = Item::with('itemUoms.uom')
                ->where('stock', '>', 0)
                ->get();

            $itemIds = $items->pluck('id')->toArray();
            $totalDays = Carbon::parse($dateFrom)->diffInDays(Carbon::parse($dateTo)) + 1;

            // Bulk query: Get total sales quantity for all items
            $salesData = DB::table('sale_details')
                ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
                ->whereIn('sale_details.item_id', $itemIds)
                ->where('sales.status', 'confirmed')
                ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
                ->select('sale_details.item_id', DB::raw('SUM(sale_details.quantity) as total_sales'))
                ->groupBy('sale_details.item_id')
                ->pluck('total_sales', 'item_id')
                ->toArray();

            $turnoverData = [];
            foreach ($items as $item) {
                $totalSales = (float) ($salesData[$item->id] ?? 0);
                $avgStock = (float) $item->stock;
                $turnoverRatio = $avgStock > 0 ? $totalSales / $avgStock : 0;
                $daysToTurnover = $turnoverRatio > 0 ? $totalDays / $turnoverRatio : 0;

                $turnoverCategory = 'slow';
                if ($turnoverRatio >= 12) {
                    $turnoverCategory = 'fast';
                } elseif ($turnoverRatio >= 6) {
                    $turnoverCategory = 'medium';
                }

                $baseUom = $item->itemUoms->where('is_base', true)->first();
                $turnoverData[] = [
                    'item_code' => $item->code,
                    'item_name' => $item->name,
                    'stock' => (float) $item->stock,
                    'unit' => $baseUom && $baseUom->uom ? $baseUom->uom->name : '-',
                    'total_sales' => $totalSales,
                    'turnover_ratio' => (float) $turnoverRatio,
                    'days_to_turnover' => (float) $daysToTurnover,
                    'turnover_category' => $turnoverCategory,
                ];
            }

            usort($turnoverData, function ($a, $b) {
                return $b['turnover_ratio'] <=> $a['turnover_ratio'];
            });

            $summary = [
                'total_items' => count($turnoverData),
                'avg_turnover_ratio' => count($turnoverData) > 0
                    ? collect($turnoverData)->avg('turnover_ratio')
                    : 0,
            ];

            $pdf = Pdf::loadView('pdf.reports.stock-turnover', [
                'title' => 'Laporan Perputaran Stok',
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'summary' => $summary,
                'turnoverData' => $turnoverData,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-perputaran-stok-' . $dateFrom . '-to-' . $dateTo . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Stock Turnover Report - Exception caught', [
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
