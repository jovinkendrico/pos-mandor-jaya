<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\Uom;
use App\Services\ItemService;
use App\Services\StockService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ItemController extends Controller
{
    public function __construct(private readonly StockService $stockService) {}

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $items = Item::with('itemUoms.uom')->orderBy('name')->paginate(10);
        $uoms  = Uom::orderBy('name')->get();

        return Inertia::render('master/item/index', [
            'items' => $items,
            'uoms'  => $uoms,
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
                'description' => $request->description,
            ]);

            foreach ($request->uoms as $uom) {
                $item->itemUoms()->create($uom);
            }

            if ($openingStock > 0) {
                $unitCost = (float) $request->modal_price;

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
