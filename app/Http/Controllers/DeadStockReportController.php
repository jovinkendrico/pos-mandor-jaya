<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\SaleDetail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DeadStockReportController extends Controller
{
    /**
     * Display dead stock report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->subMonths(3)->format('Y-m-d')); // Default 3 months
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $minDays = $request->get('min_days', 90); // Minimum days without sales

        // Get all items with stock
        $items = Item::with('itemUoms.uom')
            ->where('stock', '>', 0)
            ->get();

        $deadStockItems = [];
        $totalDeadStockValue = 0;

        foreach ($items as $item) {
            // Get last sale date for this item
            $lastSale = DB::table('sale_details')
                ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
                ->where('sale_details.item_id', $item->id)
                ->where('sales.status', 'confirmed')
                ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
                ->orderBy('sales.sale_date', 'desc')
                ->first();

            $daysWithoutSale = 0;
            $lastSaleDate = null;

            if ($lastSale) {
                $lastSaleDate = $lastSale->sale_date;
                $daysWithoutSale = Carbon::parse($lastSaleDate)->diffInDays(now());
            } else {
                // No sales in period, check if item has any sales at all
                $anySale = DB::table('sale_details')
                    ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
                    ->where('sale_details.item_id', $item->id)
                    ->where('sales.status', 'confirmed')
                    ->orderBy('sales.sale_date', 'desc')
                    ->first();

                if ($anySale) {
                    $lastSaleDate = $anySale->sale_date;
                    $daysWithoutSale = Carbon::parse($lastSaleDate)->diffInDays(now());
                } else {
                    // Never sold, use creation date or a very old date
                    $daysWithoutSale = Carbon::parse($item->created_at)->diffInDays(now());
                    $lastSaleDate = $item->created_at->format('Y-m-d');
                }
            }

            // If days without sale >= min_days, it's dead stock
            if ($daysWithoutSale >= $minDays) {
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

                $stockValue = $item->stock * $avgCost;
                $totalDeadStockValue += $stockValue;

                $baseUom = $item->itemUoms->where('is_base', true)->first();
                $unitName = $baseUom && $baseUom->uom ? $baseUom->uom->name : '-';

                $deadStockItems[] = [
                    'item_id' => $item->id,
                    'item_code' => $item->code,
                    'item_name' => $item->name,
                    'stock' => (float) $item->stock,
                    'unit' => $unitName,
                    'avg_cost' => (float) $avgCost,
                    'stock_value' => (float) $stockValue,
                    'last_sale_date' => $lastSaleDate,
                    'days_without_sale' => $daysWithoutSale,
                ];
            }
        }

        // Sort by days without sale (descending) or stock value (descending)
        usort($deadStockItems, function ($a, $b) {
            if ($a['days_without_sale'] == $b['days_without_sale']) {
                return $b['stock_value'] <=> $a['stock_value'];
            }
            return $b['days_without_sale'] <=> $a['days_without_sale'];
        });

        $summary = [
            'total_items' => count($deadStockItems),
            'total_stock_value' => $totalDeadStockValue,
            'avg_days_without_sale' => count($deadStockItems) > 0 
                ? array_sum(array_column($deadStockItems, 'days_without_sale')) / count($deadStockItems) 
                : 0,
        ];

        return Inertia::render('reports/dead-stock/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'minDays' => $minDays,
            'summary' => $summary,
            'deadStockItems' => $deadStockItems,
        ]);
    }
}
