<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryValuationController extends Controller
{
    /**
     * Display inventory valuation report
     */
    public function index(Request $request): Response
    {
        // Get all active items with stock (current inventory)
        $items = Item::with('itemUoms.uom')
            ->where('stock', '>', 0)
            ->orderBy('name')
            ->get();

        $valuationData = [];
        $totalValue = 0;
        $totalQuantity = 0;

        foreach ($items as $item) {
            // Calculate average cost from stock movements with remaining quantity
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

            // If no stock movements, use 0
            if ($avgCost == 0) {
                // Try to get from purchase details
                $avgCost = DB::table('purchase_details')
                    ->join('purchases', 'purchase_details.purchase_id', '=', 'purchases.id')
                    ->where('purchase_details.item_id', $item->id)
                    ->where('purchases.status', 'confirmed')
                    ->selectRaw('AVG(purchase_details.price) as avg_price')
                    ->value('avg_price') ?? 0;
            }

            $itemValue = $item->stock * $avgCost;
            $totalValue += $itemValue;
            $totalQuantity += $item->stock;

            // Get base UOM
            $baseUom = $item->itemUoms->where('is_base', true)->first();
            $unitName = $baseUom && $baseUom->uom ? $baseUom->uom->name : '-';

            $valuationData[] = [
                'item_id' => $item->id,
                'item_code' => $item->code,
                'item_name' => $item->name,
                'stock' => (float) $item->stock,
                'unit' => $unitName,
                'avg_cost' => (float) $avgCost,
                'total_value' => (float) $itemValue,
            ];
        }

        // Sort by value descending
        usort($valuationData, function ($a, $b) {
            return $b['total_value'] <=> $a['total_value'];
        });

        // Group by category if available (assuming items have category)
        // For now, we'll just show all items

        return Inertia::render('reports/inventory-valuation/index', [
            'summary' => [
                'total_items' => count($valuationData),
                'total_quantity' => $totalQuantity,
                'total_value' => $totalValue,
                'avg_value_per_item' => count($valuationData) > 0 ? $totalValue / count($valuationData) : 0,
            ],
            'valuationData' => $valuationData,
        ]);
    }
}
