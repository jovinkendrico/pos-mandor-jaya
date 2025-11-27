<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class StockMinMaxReportController extends Controller
{
    /**
     * Display stock min/max report
     */
    public function index(Request $request): Response
    {
        $minStockThreshold = $request->get('min_stock', 10); // Default 10
        $maxStockThreshold = $request->get('max_stock', 1000); // Default 1000

        // Get items with low stock (below minimum threshold)
        $lowStockItems = Item::with('itemUoms.uom')
            ->where('stock', '>', 0)
            ->where('stock', '<=', $minStockThreshold)
            ->orderBy('stock', 'asc')
            ->get()
            ->map(function ($item) {
                $baseUom = $item->itemUoms->where('is_base', true)->first();
                $unitName = $baseUom && $baseUom->uom ? $baseUom->uom->name : '-';
                
                return [
                    'item_id' => $item->id,
                    'item_code' => $item->code,
                    'item_name' => $item->name,
                    'stock' => (float) $item->stock,
                    'unit' => $unitName,
                ];
            });

        // Get items with high stock (above maximum threshold)
        $highStockItems = Item::with('itemUoms.uom')
            ->where('stock', '>', $maxStockThreshold)
            ->orderBy('stock', 'desc')
            ->get()
            ->map(function ($item) {
                $baseUom = $item->itemUoms->where('is_base', true)->first();
                $unitName = $baseUom && $baseUom->uom ? $baseUom->uom->name : '-';
                
                return [
                    'item_id' => $item->id,
                    'item_code' => $item->code,
                    'item_name' => $item->name,
                    'stock' => (float) $item->stock,
                    'unit' => $unitName,
                ];
            });

        // Get items with zero stock
        $zeroStockItems = Item::with('itemUoms.uom')
            ->where('stock', '<=', 0)
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($item) {
                $baseUom = $item->itemUoms->where('is_base', true)->first();
                $unitName = $baseUom && $baseUom->uom ? $baseUom->uom->name : '-';
                
                return [
                    'item_id' => $item->id,
                    'item_code' => $item->code,
                    'item_name' => $item->name,
                    'stock' => (float) $item->stock,
                    'unit' => $unitName,
                ];
            });

        // Get all items for summary
        $allItems = Item::where('stock', '>', 0)->get();
        $totalItems = Item::count();
        $itemsWithStock = $allItems->count();
        $itemsWithoutStock = $totalItems - $itemsWithStock;

        $summary = [
            'total_items' => $totalItems,
            'items_with_stock' => $itemsWithStock,
            'items_without_stock' => $itemsWithoutStock,
            'low_stock_count' => $lowStockItems->count(),
            'high_stock_count' => $highStockItems->count(),
            'zero_stock_count' => $zeroStockItems->count(),
            'min_stock_threshold' => (float) $minStockThreshold,
            'max_stock_threshold' => (float) $maxStockThreshold,
        ];

        return Inertia::render('reports/stock-min-max/index', [
            'minStockThreshold' => $minStockThreshold,
            'maxStockThreshold' => $maxStockThreshold,
            'summary' => $summary,
            'lowStockItems' => $lowStockItems,
            'highStockItems' => $highStockItems,
            'zeroStockItems' => $zeroStockItems,
        ]);
    }

    /**
     * Print stock min/max report as PDF
     */
    public function print(Request $request)
    {
        try {
            $minStockThreshold = $request->get('min_stock', 10);
            $maxStockThreshold = $request->get('max_stock', 1000);

            $lowStockItems = Item::with('itemUoms.uom')
                ->where('stock', '>', 0)
                ->where('stock', '<=', $minStockThreshold)
                ->orderBy('stock', 'asc')
                ->get()
                ->map(function ($item) {
                    $baseUom = $item->itemUoms->where('is_base', true)->first();
                    return [
                        'item_code' => $item->code,
                        'item_name' => $item->name,
                        'stock' => (float) $item->stock,
                        'unit' => $baseUom && $baseUom->uom ? $baseUom->uom->name : '-',
                    ];
                });

            $highStockItems = Item::with('itemUoms.uom')
                ->where('stock', '>', $maxStockThreshold)
                ->orderBy('stock', 'desc')
                ->get()
                ->map(function ($item) {
                    $baseUom = $item->itemUoms->where('is_base', true)->first();
                    return [
                        'item_code' => $item->code,
                        'item_name' => $item->name,
                        'stock' => (float) $item->stock,
                        'unit' => $baseUom && $baseUom->uom ? $baseUom->uom->name : '-',
                    ];
                });

            $zeroStockItems = Item::with('itemUoms.uom')
                ->where('stock', '<=', 0)
                ->orderBy('name', 'asc')
                ->get()
                ->map(function ($item) {
                    $baseUom = $item->itemUoms->where('is_base', true)->first();
                    return [
                        'item_code' => $item->code,
                        'item_name' => $item->name,
                        'stock' => (float) $item->stock,
                        'unit' => $baseUom && $baseUom->uom ? $baseUom->uom->name : '-',
                    ];
                });

            $summary = [
                'low_stock_count' => $lowStockItems->count(),
                'high_stock_count' => $highStockItems->count(),
                'zero_stock_count' => $zeroStockItems->count(),
                'min_stock_threshold' => (float) $minStockThreshold,
                'max_stock_threshold' => (float) $maxStockThreshold,
            ];

            $pdf = Pdf::loadView('pdf.reports.stock-min-max', [
                'title' => 'Laporan Stok Minimum/Maksimum',
                'summary' => $summary,
                'lowStockItems' => $lowStockItems,
                'highStockItems' => $highStockItems,
                'zeroStockItems' => $zeroStockItems,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-stok-min-max-' . now()->format('Y-m-d') . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Stock Min/Max Report - Exception caught', [
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
