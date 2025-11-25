<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\SaleDetail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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

        $turnoverData = [];
        $totalDays = Carbon::parse($dateFrom)->diffInDays(Carbon::parse($dateTo)) + 1;

        foreach ($items as $item) {
            // Get total sales quantity in period
            $totalSales = DB::table('sale_details')
                ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
                ->where('sale_details.item_id', $item->id)
                ->where('sales.status', 'confirmed')
                ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
                ->sum('sale_details.quantity') ?? 0;

            // Get average stock in period (simplified: use current stock)
            // In a more sophisticated system, we'd calculate average stock over the period
            $avgStock = (float) $item->stock;

            // Calculate average cost
            $avgCost = DB::table('stock_movements')
                ->where('item_id', $item->id)
                ->where('remaining_quantity', '>', 0)
                ->selectRaw('
                    CASE
                        WHEN SUM(remaining_quantity) > 0
                        THEN SUM(unit_cost * remaining_quantity) / SUM(remaining_quantity)
                        ELSE 0
                    END as avg_cost
                ')
                ->value('avg_cost') ?? 0;

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
                'total_sales' => (float) $totalSales,
                'avg_stock' => $avgStock,
                'avg_cost' => (float) $avgCost,
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
}
