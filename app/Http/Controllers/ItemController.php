<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\Uom;
use App\Services\ItemService;
use App\Services\StockService;
use App\Services\JournalService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ItemController extends Controller
{
    public function __construct(
        private readonly StockService $stockService,
        private readonly JournalService $journalService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(\Illuminate\Http\Request $request): Response
    {
        $query = Item::with('itemUoms.uom');

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by stock level
        if ($request->has('stock_filter') && $request->stock_filter !== 'all') {
            if ($request->stock_filter === 'low') {
                $query->where('stock', '<=', 10);
            } elseif ($request->stock_filter === 'out') {
                $query->where('stock', '<=', 0);
            } elseif ($request->stock_filter === 'in_stock') {
                $query->where('stock', '>', 0);
            }
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $allowedSortFields = ['name', 'code', 'stock'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('name', 'asc');
        }
        $query->orderBy('id', 'asc');

        $items = $query->paginate(10)->withQueryString();
        $uoms  = Uom::orderBy('name')->get();

        return Inertia::render('master/item/index', [
            'items' => $items,
            'uoms'  => $uoms,
            'filters' => [
                'search' => $request->get('search', ''),
                'stock_filter' => $request->get('stock_filter', 'all'),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): RedirectResponse
    {
        return redirect()->route('items.index');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItemRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $code         = ItemService::generateCode();
            $openingStock = (float) ($request->stock ?? 0);

            $item = Item::create([
                'code'        => $code,
                'name'        => $request->name,
                'stock'       => $openingStock,
                'initial_stock' => $openingStock,
                'description' => $request->description,
            ]);

            foreach ($request->uoms as $uom) {
                $item->itemUoms()->create($uom);
            }

            if ($openingStock > 0) {
                $unitCost = (float) ($request->modal_price ?? 0);

                StockMovement::create([
                    'item_id'            => $item->id,
                    'reference_type'     => 'OpeningBalance',
                    'reference_id'       => $item->id,
                    'quantity'           => $openingStock,
                    'unit_cost'          => $unitCost,
                    'remaining_quantity' => $openingStock,
                    'movement_date'      => now(),
                    'notes'              => 'Opening balance saat pembuatan barang',
                ]);

                // Post opening stock to journal if unit cost > 0
                if ($unitCost > 0) {
                    $this->journalService->postItemOpeningStock($item, $openingStock, $unitCost);
                }
            }
        });

        return redirect()->route('items.index')
            ->with('success', 'Barang berhasil ditambahkan.');
    }


    /**
     * Display the specified resource.
     */
    public function show(Item $item): Response
    {
        $item->load('itemUoms.uom');

        $stockMovements = $item->stockMovements()
            ->orderByDesc('movement_date')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('master/item/show', [
            'item'           => $item,
            'stockMovements' => $stockMovements,
        ]);
    }

    /**
     * Display stock card for an item.
     */
    public function stockCard(\Illuminate\Http\Request $request, Item $item): Response
    {
        $query = StockMovement::where('item_id', $item->id)
            ->orderBy('movement_date', 'asc')
            ->orderBy('id', 'asc');

        // Filter by date range if provided
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('movement_date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('movement_date', '<=', $request->date_to);
        }

        // Filter by reference type
        if ($request->has('reference_type') && $request->reference_type !== 'all') {
            $query->where('reference_type', $request->reference_type);
        }

        $stockMovements = $query->get();

        // Calculate opening stock using stored initial_stock
        // Get initial stock from database (stored when item was created)
        $initialStock = (float) ($item->initial_stock ?? 0);

        if ($request->has('date_from') && $request->date_from) {
            // Calculate opening stock before the date range
            $firstTransactionDate = $request->date_from;
            
            // Get all movements before the date range
            $movementsBefore = StockMovement::where('item_id', $item->id)
                ->whereDate('movement_date', '<', $firstTransactionDate)
                ->sum('quantity');
            
            // Opening stock = Initial stock + movements before date
            $openingStock = $initialStock + (float) $movementsBefore;
        } else {
            // No date filter: opening stock is the initial stock when item was created
            $openingStock = $initialStock;
        }

        // Calculate running balance
        $runningStock = $openingStock;
        $transactionsWithBalance = $stockMovements->map(function ($movement) use (&$runningStock) {
            $runningStock = $runningStock + (float) $movement->quantity;
            return [
                'id' => $movement->id,
                'date' => $movement->movement_date,
                'reference_type' => $movement->reference_type,
                'reference_id' => $movement->reference_id,
                'notes' => $movement->notes,
                'in' => (float) $movement->quantity > 0 ? (float) $movement->quantity : 0,
                'out' => (float) $movement->quantity < 0 ? abs((float) $movement->quantity) : 0,
                'balance' => $runningStock,
            ];
        });

        // Paginate manually
        $page = (int) $request->get('page', 1);
        $perPage = 15;
        $total = $transactionsWithBalance->count();
        $items = $transactionsWithBalance->slice(($page - 1) * $perPage, $perPage)->values();

        $paginatedData = new \Illuminate\Pagination\LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        // Get reference details for display
        $referenceTypes = $transactionsWithBalance->pluck('reference_type')->unique()->toArray();

        return Inertia::render('master/item/stock-card', [
            'item' => $item,
            'transactions' => $paginatedData,
            'openingStock' => $openingStock,
            'closingStock' => $runningStock,
            'filters' => [
                'date_from' => $request->get('date_from', ''),
                'date_to' => $request->get('date_to', ''),
                'reference_type' => $request->get('reference_type', 'all'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Item $item): RedirectResponse
    {
        return redirect()->route('items.index');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateItemRequest $request, Item $item): RedirectResponse
    {
        DB::transaction(function () use ($request, $item) {
            $existingStock = (float) $item->stock;
            $targetStock   = (float) ($request->stock ?? $existingStock);

            $item->update([
                'name'        => $request->name,
                'description' => $request->description,
            ]);

            $item->itemUoms()->forceDelete();

            foreach ($request->uoms as $uom) {
                $item->itemUoms()->create($uom);
            }

            $diff = $targetStock - $existingStock;
            if ($diff > 0) {
                $unitCost = (float) ($request->modal_price ?? 0);

                $item->increment('stock', $diff);

                StockMovement::create([
                    'item_id'            => $item->id,
                    'reference_type'     => 'Adjustment',
                    'reference_id'       => $item->id,
                    'quantity'           => $diff,
                    'unit_cost'          => $unitCost,
                    'remaining_quantity' => $diff,
                    'movement_date'      => now(),
                    'notes'              => 'Penyesuaian stok manual (IN)',
                ]);
            } elseif ($diff < 0) {
                $this->stockService->consumeForAdjustment($item, abs($diff));
            }
        });

        return redirect()->route('items.index')
            ->with('success', 'Barang berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Item $item): RedirectResponse
    {
        $item->delete();

        return redirect()->route('items.index')
            ->with('success', 'Barang berhasil dihapus.');
    }
}
