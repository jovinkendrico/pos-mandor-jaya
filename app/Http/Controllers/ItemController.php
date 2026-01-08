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
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\SaleReturn;
use App\Models\PurchaseReturn;

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
        $query = Item::with(['itemUoms' => function ($q) {
            $q->where('is_active', true)->with('uom');
        }]);

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

        // Calculate pending stock for each item (Sales and Purchases that are Pending)
        $items->getCollection()->transform(function ($item) {
             // Sales Pending (Stock Out Pending)
             $pendingSalesQty = \App\Models\SaleDetail::query()
                ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
                ->join('item_uoms', 'item_uoms.id', '=', 'sale_details.item_uom_id')
                ->where('sale_details.item_id', $item->id)
                ->where('sales.status', 'pending')
                ->sum(\DB::raw('sale_details.quantity * item_uoms.conversion_value'));

             // Purchases Pending (Stock In Pending)
             $pendingPurchasesQty = \App\Models\PurchaseDetail::query()
                ->join('purchases', 'purchases.id', '=', 'purchase_details.purchase_id')
                ->join('item_uoms', 'item_uoms.id', '=', 'purchase_details.item_uom_id')
                ->where('purchase_details.item_id', $item->id)
                ->where('purchases.status', 'pending')
                ->sum(\DB::raw('purchase_details.quantity * item_uoms.conversion_value'));
             
             $item->pending_stock = (float)$pendingSalesQty; // Customer booked but not confirmed
             $item->pending_purchase_stock = (float)$pendingPurchasesQty; // On the way
             // User Request: available stock = item->stock + pending purchase - pending stock
             $item->available_stock = (float)$item->stock + (float)$pendingPurchasesQty - (float)$pendingSalesQty;
             
             return $item;
        });

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
        $item->load(['itemUoms' => function ($q) {
            $q->where('is_active', true)->with('uom');
        }]);

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
            // No replacement needed here, just checking.r: opening stock is the initial stock when item was created
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

        $page = (int) $request->get('page', 1);
        $perPage = 15;
        $total = $transactionsWithBalance->count();
        $items = $transactionsWithBalance->slice(($page - 1) * $perPage, $perPage)->values();

        // Enrich items with entity names (Customer/Supplier) and Prices
    $saleIds = $items->where('reference_type', 'Sale')->pluck('reference_id');
    $purchaseIds = $items->where('reference_type', 'Purchase')->pluck('reference_id');
    $saleReturnIds = $items->where('reference_type', 'SaleReturn')->pluck('reference_id');
    $purchaseReturnIds = $items->where('reference_type', 'PurchaseReturn')->pluck('reference_id');

    $sales = Sale::whereIn('id', $saleIds)->with('customer:id,name')->get()->keyBy('id');
    $purchases = Purchase::whereIn('id', $purchaseIds)->with('supplier:id,name')->get()->keyBy('id');
    $saleReturns = SaleReturn::whereIn('id', $saleReturnIds)->with('sale.customer:id,name')->get()->keyBy('id');
    $purchaseReturns = PurchaseReturn::whereIn('id', $purchaseReturnIds)->with('purchase.supplier:id,name')->get()->keyBy('id');

    // Fetch Details for Pricing
    $saleDetails = \App\Models\SaleDetail::whereIn('sale_id', $saleIds)
        ->where('item_id', $item->id)
        ->with('itemUom.uom')
        ->get()
        ->keyBy('sale_id');

    $purchaseDetails = \App\Models\PurchaseDetail::whereIn('purchase_id', $purchaseIds)
        ->where('item_id', $item->id)
        ->with('itemUom.uom')
        ->get()
        ->keyBy('purchase_id');
        
    $saleReturnDetails = \App\Models\SaleReturnDetail::whereIn('sale_return_id', $saleReturnIds)
        ->where('item_id', $item->id)
        ->with('itemUom.uom')
        ->get()
        ->keyBy('sale_return_id');

    $purchaseReturnDetails = \App\Models\PurchaseReturnDetail::whereIn('purchase_return_id', $purchaseReturnIds)
        ->where('item_id', $item->id)
        ->with('itemUom.uom')
        ->get()
        ->keyBy('purchase_return_id');

    // Get Base UOM Name
    $baseUomName = $item->itemUoms()->where('is_base', true)->with('uom')->first()->uom->name ?? 'Units';

    $items->transform(function ($row) use ($sales, $purchases, $saleReturns, $purchaseReturns, $saleDetails, $purchaseDetails, $saleReturnDetails, $purchaseReturnDetails, $baseUomName) {
        $entityName = '';
        $price = 0;
        $uom = $baseUomName;
        
        if ($row['reference_type'] === 'Sale') {
            if (isset($sales[$row['reference_id']])) {
                $entityName = $sales[$row['reference_id']]->customer->name ?? '';
            }
            if (isset($saleDetails[$row['reference_id']])) {
                $detail = $saleDetails[$row['reference_id']];
                $conversion = $detail->itemUom->conversion_value ?? 1;
                $price = $conversion > 0 ? ($detail->price / $conversion) : 0;
            }
        } elseif ($row['reference_type'] === 'Purchase') {
            if (isset($purchases[$row['reference_id']])) {
                $entityName = $purchases[$row['reference_id']]->supplier->name ?? '';
            }
             if (isset($purchaseDetails[$row['reference_id']])) {
                $detail = $purchaseDetails[$row['reference_id']];
                $conversion = $detail->itemUom->conversion_value ?? 1;
                $price = $conversion > 0 ? ($detail->price / $conversion) : 0;
            }
        } elseif ($row['reference_type'] === 'SaleReturn') {
            if (isset($saleReturns[$row['reference_id']])) {
                $entityName = $saleReturns[$row['reference_id']]->sale->customer->name ?? '';
            }
            if (isset($saleReturnDetails[$row['reference_id']])) {
                $detail = $saleReturnDetails[$row['reference_id']];
                $conversion = $detail->itemUom->conversion_value ?? 1;
                $price = $conversion > 0 ? ($detail->price / $conversion) : 0;
            }
        } elseif ($row['reference_type'] === 'PurchaseReturn') {
            if (isset($purchaseReturns[$row['reference_id']])) {
                $entityName = $purchaseReturns[$row['reference_id']]->purchase->supplier->name ?? '';
            }
            if (isset($purchaseReturnDetails[$row['reference_id']])) {
                $detail = $purchaseReturnDetails[$row['reference_id']];
                $conversion = $detail->itemUom->conversion_value ?? 1;
                $price = $conversion > 0 ? ($detail->price / $conversion) : 0;
            }
        }

        if ($entityName) {
            $row['notes'] = ($row['notes'] ? $row['notes'] . ' - ' : '') . $entityName;
        }

        $row['price'] = $price;
        $row['uom'] = $uom; // Always use base UOM
        
        return $row;
    });

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

            $existingUomIds = $item->itemUoms->pluck('id')->toArray();
            $keptUomIds = [];

            // Reset is_base for all UOMs of this item to ensure single base integrity
            $item->itemUoms()->update(['is_base' => false]);

            foreach ($request->uoms as $uomData) {
                // Try to find existing ItemUom by uom_id (Unit of Measure ID) for this Item
                $existingItemUom = $item->itemUoms()->where('uom_id', $uomData['uom_id'])->first();

                if ($existingItemUom) {
                    // Update existing
                    $existingItemUom->update([
                        'conversion_value' => $uomData['conversion_value'],
                        'price'            => $uomData['price'] ?? 0,
                        'is_active'        => true, // Reactivate if it was soft deleted
                        'is_base'          => $uomData['is_base'] ?? false,
                    ]);
                    $keptUomIds[] = $existingItemUom->id;
                } else {
                    // Create new
                    $newItemUom = $item->itemUoms()->create(array_merge($uomData, [
                        'is_active' => true,
                        'is_base'   => $uomData['is_base'] ?? false
                    ]));
                    $keptUomIds[] = $newItemUom->id;
                }
            }

            // Identify metadata to delete (ItemUoms that are no longer in the request)
            $uomIdsToDelete = array_diff($existingUomIds, $keptUomIds);

            if (!empty($uomIdsToDelete)) {
                // Determine if any can be deleted
                foreach ($uomIdsToDelete as $idToDelete) {
                    $isUsedInSales = \DB::table('sale_details')->where('item_uom_id', $idToDelete)->exists();
                    $isUsedInPurchases = \DB::table('purchase_details')->where('item_uom_id', $idToDelete)->exists();

                    if ($isUsedInSales || $isUsedInPurchases) {
                        // CANNOT DELETE: It is used in transactions.
                        // Soft delete (deactivate) so it remains in history but hidden from new selections
                        \App\Models\ItemUom::where('id', $idToDelete)->update(['is_active' => false]);
                        continue; 
                    }

                    // Safe to delete
                    \App\Models\ItemUom::where('id', $idToDelete)->delete();
                }
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

        return redirect()->back()
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
