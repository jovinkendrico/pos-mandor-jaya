<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\StoreStockMovementRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Http\Requests\UpdateStockMovementRequest;
use App\Models\Item;
use App\Models\Uom;
use App\Services\ItemService;
use App\Models\StockMovement;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {

        $items = Item::with('itemUoms.uom')->orderBy('name')->paginate(10);

        $uoms = Uom::all();

        return Inertia::render('master/item/index', [
            'items' => $items,
            'uoms'  => $uoms,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('master/item/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItemRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $code = ItemService::generateCode();

            $item = Item::create([
                'code'        => $code,
                'name'        => $request->name,
                'base_uom'    => $request->base_uom,
                'stock'       => $request->stock ?? 0,
                'description' => $request->description,
            ]);



            // Create UOMs
            foreach ($request->uoms as $uom) {
                $item->itemUoms()->create($uom);
            }

            $initialStock = (float) ($request->stock ?? 0);
            if ($initialStock > 0) {
                $baseUomData = collect($request->uoms)->firstWhere('is_base', true);
                $unitCost    = $baseUomData['price'] ?? 0;

                StockMovement::create([
                    'item_id'            => $item->id,
                    'reference_type'     => 'Stock Awal',
                    'reference_id'       => null,
                    'quantity'           => $initialStock,
                    'unit_cost'          => $unitCost,
                    'remaining_quantity' => $initialStock,
                    'movement_date'      => now()->toDateString(),
                    'notes'              => 'Stock awal saat pembuatan barang',
                ]);
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
        // Load the main item (with related info if needed)
        $item->load('itemUoms.uom');

        // Get paginated stock movements separately
        $stockMovements = $item->stockMovements()
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('master/item/show', [
            'item'           => $item,
            'stockMovements' => $stockMovements,
        ]);
    }


    public function storeStockMovement(StoreStockMovementRequest $request, Item $item): RedirectResponse
    {
        $item->stockMovements()->create($request->validated());
        return redirect()->route('items.show', $item)->with('success', 'Stock movement berhasil ditambahkan.');
    }

    public function updateStockMovement(UpdateStockMovementRequest $request, Item $item, StockMovement $stockMovement): RedirectResponse
    {
        $stockMovement->update($request->validated());
        return redirect()->route('items.show', $item)->with('success', 'Stock movement berhasil diperbarui.');
    }

    public function destroyStockMovement(Item $item): RedirectResponse
    {
        $item->stockMovements()->forceDelete();
        return redirect()->route('items.show', $item)->with('success', 'Stock movement berhasil dihapus.');
    }



    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Item $item): Response
    {
        $item->load('uoms');

        return Inertia::render('master/item/edit', [
            'item' => $item,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateItemRequest $request, Item $item): RedirectResponse
    {
        $originalStock  = (float) $item->stock;
        $requestedStock = (float) ($request->stock ?? 0);

        DB::transaction(function () use ($request, $item, $originalStock, $requestedStock) {
            $item->update([
                'name'        => $request->name,
                'base_uom'    => $request->base_uom,
                'stock'       => $requestedStock,
                'description' => $request->description,
            ]);

            // Force delete existing UOMs (permanent delete untuk avoid unique constraint issue)
            $item->itemUoms()->forceDelete();

            // Create new UOMs
            foreach ($request->uoms as $uom) {
                $item->itemUoms()->create($uom);
            }

            $stockDifference = $requestedStock - $originalStock;

            if (abs($stockDifference) > 0.0001) {
                $uomsCollection = collect($request->uoms ?? []);
                $baseUomData    = $uomsCollection->firstWhere('is_base', true) ?? $uomsCollection->first();
                $unitCost       = (float) ($baseUomData['price'] ?? 0);

                if ($stockDifference < 0) {
                    $quantityToReduce  = abs($stockDifference);
                    $existingMovements = StockMovement::where('item_id', $item->id)
                        ->where('remaining_quantity', '>', 0)
                        ->orderBy('movement_date', 'asc')
                        ->orderBy('id', 'asc')
                        ->get();

                    foreach ($existingMovements as $movement) {
                        if ($quantityToReduce <= 0) {
                            break;
                        }

                        $reduction = min($quantityToReduce, (float) $movement->remaining_quantity);
                        $movement->decrement('remaining_quantity', $reduction);
                        $quantityToReduce -= $reduction;
                    }
                }

                StockMovement::create([
                    'item_id'            => $item->id,
                    'reference_type'     => $stockDifference > 0 ? 'Penyesuaian Stock (IN)' : 'Penyesuaian Stock (OUT)',
                    'reference_id'       => null,
                    'quantity'           => $stockDifference,
                    'unit_cost'          => $unitCost,
                    'remaining_quantity' => $stockDifference > 0 ? $stockDifference : 0,
                    'movement_date'      => now()->toDateString(),
                    'notes'              => 'Penyesuaian stock melalui update data barang',
                ]);
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
