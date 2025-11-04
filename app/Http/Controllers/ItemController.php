<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
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
            // Create stock movement for initial stock with modal_price as unit_cost
            if ($request->stock > 0 && $request->modal_price) {
                StockMovement::create([
                    'item_id'            => $item->id,
                    'reference_type'     => 'Initial',
                    'reference_id'       => 0,
                    'quantity'           => $request->stock,
                    'unit_cost'          => $request->modal_price,
                    'remaining_quantity' => $request->stock,
                    'movement_date'      => now(),
                    'notes'              => 'Initial stock by user',
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
        $item->load('uoms');

        return Inertia::render('master/item/show', [
            'item' => $item,
        ]);
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
        DB::transaction(function () use ($request, $item) {

            $item->update([
                'name'        => $request->name,
                'base_uom'    => $request->base_uom,
                'stock'       => $request->stock ?? 0,
                'description' => $request->description,
            ]);

            // Force delete existing UOMs (permanent delete untuk avoid unique constraint issue)
            $item->itemUoms()->forceDelete();

            // Create new UOMs
            foreach ($request->uoms as $uom) {
                $item->itemUoms()->create($uom);
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
