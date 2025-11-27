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

        $itemIds = $items->pluck('id')->toArray();
        $deadStockItems = [];
        $totalDeadStockValue = 0;

        // Bulk query: Get last sale date in period for all items
        $lastSalesInPeriod = DB::table('sale_details')
            ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
            ->whereIn('sale_details.item_id', $itemIds)
            ->where('sales.status', 'confirmed')
            ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
            ->select('sale_details.item_id', DB::raw('MAX(sales.sale_date) as last_sale_date'))
            ->groupBy('sale_details.item_id')
            ->pluck('last_sale_date', 'item_id')
            ->toArray();

        // Bulk query: Get last sale date ever for all items (for items with no sales in period)
        $lastSalesEver = DB::table('sale_details')
            ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
            ->whereIn('sale_details.item_id', $itemIds)
            ->where('sales.status', 'confirmed')
            ->select('sale_details.item_id', DB::raw('MAX(sales.sale_date) as last_sale_date'))
            ->groupBy('sale_details.item_id')
            ->pluck('last_sale_date', 'item_id')
            ->toArray();

        // Bulk query: Get average cost for all items
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

        foreach ($items as $item) {
            $daysWithoutSale = 0;
            $lastSaleDate = null;

            // Check if item has sales in period
            if (isset($lastSalesInPeriod[$item->id])) {
                $lastSaleDate = $lastSalesInPeriod[$item->id];
                $daysWithoutSale = Carbon::parse($lastSaleDate)->diffInDays(now());
            } elseif (isset($lastSalesEver[$item->id])) {
                // No sales in period, but has sales before
                $lastSaleDate = $lastSalesEver[$item->id];
                $daysWithoutSale = Carbon::parse($lastSaleDate)->diffInDays(now());
            } else {
                // Never sold, use creation date
                $daysWithoutSale = Carbon::parse($item->created_at)->diffInDays(now());
                $lastSaleDate = $item->created_at->format('Y-m-d');
            }

            // If days without sale >= min_days, it's dead stock
            if ($daysWithoutSale >= $minDays) {
                // Get average cost from bulk query result
                $avgCost = (float) ($costData[$item->id] ?? 0);
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
                    'avg_cost' => $avgCost,
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

    /**
     * Print dead stock report as PDF
     */
    public function print(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->subMonths(3)->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));
            $minDays = $request->get('min_days', 90);

            $items = Item::with('itemUoms.uom')
                ->where('stock', '>', 0)
                ->get();

            $itemIds = $items->pluck('id')->toArray();

            // Bulk query: Get last sale date for all items
            $lastSales = DB::table('sale_details')
                ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
                ->whereIn('sale_details.item_id', $itemIds)
                ->where('sales.status', 'confirmed')
                ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
                ->select('sale_details.item_id', DB::raw('MAX(sales.sale_date) as last_sale_date'))
                ->groupBy('sale_details.item_id')
                ->pluck('last_sale_date', 'item_id')
                ->toArray();

            $deadStockItems = [];
            foreach ($items as $item) {
                $daysWithoutSale = isset($lastSales[$item->id])
                    ? Carbon::parse($lastSales[$item->id])->diffInDays(now())
                    : Carbon::parse($item->created_at)->diffInDays(now());

                if ($daysWithoutSale >= $minDays) {
                    $baseUom = $item->itemUoms->where('is_base', true)->first();
                    $deadStockItems[] = [
                        'item_code' => $item->code,
                        'item_name' => $item->name,
                        'stock' => (float) $item->stock,
                        'unit' => $baseUom && $baseUom->uom ? $baseUom->uom->name : '-',
                        'days_without_sale' => $daysWithoutSale,
                    ];
                }
            }

            usort($deadStockItems, function ($a, $b) {
                return $b['days_without_sale'] <=> $a['days_without_sale'];
            });

            $summary = [
                'total_items' => count($deadStockItems),
                'min_days' => $minDays,
            ];

            $pdf = Pdf::loadView('pdf.reports.dead-stock', [
                'title' => 'Laporan Barang Tidak Laku',
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'summary' => $summary,
                'deadStockItems' => $deadStockItems,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-barang-tidak-laku-' . $dateFrom . '-to-' . $dateTo . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Dead Stock Report - Exception caught', [
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
