<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockAdjustmentRequest;
use App\Models\Item;
use App\Models\StockMovement;
use App\Services\StockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class StockAdjustmentController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = StockMovement::with('item')
            ->where('reference_type', 'StockAdjustment')
            ->orderBy('movement_date', 'desc')
            ->orderBy('id', 'desc');

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('movement_date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('movement_date', '<=', $request->date_to);
        }

        // Filter by item
        if ($request->has('item_id') && $request->item_id) {
            $query->where('item_id', $request->item_id);
        }

        // Filter by adjustment type (increase/decrease)
        if ($request->has('adjustment_type') && $request->adjustment_type !== 'all') {
            if ($request->adjustment_type === 'increase') {
                $query->where('quantity', '>', 0);
            } elseif ($request->adjustment_type === 'decrease') {
                $query->where('quantity', '<', 0);
            }
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'movement_date');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = ['movement_date', 'quantity', 'unit_cost'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('movement_date', 'desc');
        }
        $query->orderBy('id', 'desc');

        $adjustments = $query->paginate(10)->withQueryString();

        // Get only first 10 items for initial display (will be searched via API)
        $items = Item::with('itemUoms.uom')
            ->orderBy('name')
            ->limit(10)
            ->get();

        return Inertia::render('master/stock-adjustment/index', [
            'adjustments' => $adjustments,
            'items' => $items,
            'filters' => [
                'search' => $request->get('search', ''),
                'date_from' => $request->get('date_from', ''),
                'date_to' => $request->get('date_to', ''),
                'item_id' => $request->get('item_id', ''),
                'adjustment_type' => $request->get('adjustment_type', 'all'),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Get only first 10 items for initial display (will be searched via API)
        $items = Item::with('itemUoms.uom')
            ->orderBy('name')
            ->limit(10)
            ->get();

        return Inertia::render('master/stock-adjustment/create', [
            'items' => $items,
        ]);
    }

    /**
     * Search items for combobox (API endpoint)
     */
    public function searchItems(Request $request): \Illuminate\Http\JsonResponse
    {
        $search = $request->get('search', '');
        $itemId = $request->get('id', '');
        $limit = 20; // Limit results to 20 items

        $query = Item::with('itemUoms.uom')
            ->orderBy('name');

        // If searching by ID, get that specific item
        if ($itemId) {
            $query->where('id', $itemId);
        } elseif ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $items = $query->limit($limit)->get();

        $options = $items->map(function ($item) {
            return [
                'value' => (string) $item->id,
                'label' => ($item->code ? $item->code . ' - ' : '') . $item->name,
                'item' => [
                    'id' => $item->id,
                    'code' => $item->code,
                    'name' => $item->name,
                    'stock' => $item->stock,
                    'modal_price' => $item->modal_price,
                    'itemUoms' => $item->itemUoms,
                ],
            ];
        });

        return response()->json([
            'data' => $options,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreStockAdjustmentRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $item = Item::findOrFail($request->item_id);
            $quantity = (float) $request->quantity;
            $unitCost = (float) ($request->unit_cost ?? 0);
            $adjustmentDate = $request->adjustment_date ?? now();

            $this->stockService->adjustStock(
                $item,
                $quantity,
                $unitCost,
                $adjustmentDate,
                $request->notes ?? ''
            );
        });

        return redirect()->route('stock-adjustments.index')
            ->with('success', 'Penyesuaian stok berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show($id): Response
    {
        $stockAdjustment = StockMovement::with('item')
            ->where('id', $id)
            ->where('reference_type', 'StockAdjustment')
            ->firstOrFail();

        return Inertia::render('master/stock-adjustment/show', [
            'adjustment' => $stockAdjustment,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id): RedirectResponse
    {
        $stockAdjustment = StockMovement::with('item')
            ->where('id', $id)
            ->where('reference_type', 'StockAdjustment')
            ->firstOrFail();

        DB::transaction(function () use ($stockAdjustment) {
            $item = $stockAdjustment->item;
            $quantity = $stockAdjustment->quantity;

            // Reverse journal entry if exists
            try {
                app(\App\Services\JournalService::class)->reverseStockAdjustment($stockAdjustment);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to reverse stock adjustment journal entry', [
                    'stock_movement_id' => $stockAdjustment->id,
                    'error' => $e->getMessage(),
                ]);
                // Don't throw - allow deletion even if journal reversal fails
            }

            // Reverse the adjustment
            if ($quantity > 0) {
                // Was an increase, so decrease
                $item->decrement('stock', $quantity);
            } else {
                // Was a decrease, so increase
                $item->increment('stock', abs($quantity));
            }

            // Delete the movement
            $stockAdjustment->delete();
        });

        return redirect()->route('stock-adjustments.index')
            ->with('success', 'Penyesuaian stok berhasil dihapus.');
    }
}
