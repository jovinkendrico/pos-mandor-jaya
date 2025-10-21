<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\UpdatePurchaseRequest;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Item;
use App\Services\StockService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $purchases = Purchase::with(['supplier', 'details.item', 'details.itemUom'])
            ->orderBy('purchase_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('transaction/purchase/index', [
            'purchases' => [
                'data' => $purchases,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $suppliers = Supplier::orderBy('name')->limit(10)->get();
        $items = Item::with('uoms')->orderBy('name')->get();

        return Inertia::render('transaction/purchase/create', [
            'suppliers' => $suppliers,
            'items' => $items,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePurchaseRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            // Calculate totals dari semua items
            $subtotal = 0;
            $detailsData = [];

            foreach ($request->details as $detail) {
                // Calculate per item
                $amount = $detail['quantity'] * $detail['price'];

                // Discount 1 per item
                $itemDiscount1Percent = $detail['discount1_percent'] ?? 0;
                $itemDiscount1Amount = ($amount * $itemDiscount1Percent) / 100;
                $afterDiscount1 = $amount - $itemDiscount1Amount;

                // Discount 2 per item
                $itemDiscount2Percent = $detail['discount2_percent'] ?? 0;
                $itemDiscount2Amount = ($afterDiscount1 * $itemDiscount2Percent) / 100;
                $itemSubtotal = $afterDiscount1 - $itemDiscount2Amount;

                $subtotal += $itemSubtotal;

                $detailsData[] = [
                    'item_id' => $detail['item_id'],
                    'item_uom_id' => $detail['item_uom_id'],
                    'quantity' => $detail['quantity'],
                    'price' => $detail['price'],
                    'discount1_percent' => $itemDiscount1Percent,
                    'discount1_amount' => $itemDiscount1Amount,
                    'discount2_percent' => $itemDiscount2Percent,
                    'discount2_amount' => $itemDiscount2Amount,
                    'subtotal' => $itemSubtotal,
                ];
            }

            // Calculate discount 1
            $discount1Percent = $request->discount1_percent ?? 0;
            $discount1Amount = ($subtotal * $discount1Percent) / 100;

            // Calculate discount 2 (applied after discount 1)
            $afterDiscount1 = $subtotal - $discount1Amount;
            $discount2Percent = $request->discount2_percent ?? 0;
            $discount2Amount = ($afterDiscount1 * $discount2Percent) / 100;

            $totalAfterDiscount = $afterDiscount1 - $discount2Amount;

            // Calculate PPN
            $ppnPercent = $request->ppn_percent ?? 0;
            $ppnAmount = ($totalAfterDiscount * $ppnPercent) / 100;

            $totalAmount = $totalAfterDiscount + $ppnAmount;

            // Create purchase
            $purchase = Purchase::create([
                'purchase_number' => Purchase::generatePurchaseNumber(),
                'supplier_id' => $request->supplier_id,
                'purchase_date' => $request->purchase_date,
                'due_date' => $request->due_date,
                'subtotal' => $subtotal,
                'discount1_percent' => $discount1Percent,
                'discount1_amount' => $discount1Amount,
                'discount2_percent' => $discount2Percent,
                'discount2_amount' => $discount2Amount,
                'total_after_discount' => $totalAfterDiscount,
                'ppn_percent' => $ppnPercent,
                'ppn_amount' => $ppnAmount,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'notes' => $request->notes,
            ]);

            // Create purchase details
            foreach ($detailsData as $detailData) {
                $purchase->details()->create($detailData);
            }
        });

        return redirect()->route('purchases.index')
            ->with('success', 'Pembelian berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Purchase $purchase): Response
    {
        $purchase->load(['supplier', 'details.item', 'details.itemUom']);

        return Inertia::render('transaction/purchase/show', [
            'purchase' => $purchase,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Purchase $purchase): Response
    {
        // Only allow edit if status is pending
        if ($purchase->status === 'confirmed') {
            return redirect()->route('purchases.show', $purchase)
                ->with('error', 'Pembelian yang sudah dikonfirmasi tidak dapat diedit.');
        }

        $purchase->load(['details.item', 'details.itemUom']);
        $suppliers = Supplier::orderBy('name')->limit(10)->get();
        $items = Item::with('uoms')->orderBy('name')->get();

        return Inertia::render('transaction/purchase/edit', [
            'purchase' => $purchase,
            'suppliers' => $suppliers,
            'items' => $items,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePurchaseRequest $request, Purchase $purchase): RedirectResponse
    {
        // Only allow update if status is pending
        if ($purchase->status === 'confirmed') {
            return redirect()->route('purchases.show', $purchase)
                ->with('error', 'Pembelian yang sudah dikonfirmasi tidak dapat diedit.');
        }

        DB::transaction(function () use ($request, $purchase) {
            // Calculate totals dari semua items (same as store)
            $subtotal = 0;
            $detailsData = [];

            foreach ($request->details as $detail) {
                // Calculate per item
                $amount = $detail['quantity'] * $detail['price'];

                // Discount 1 per item
                $itemDiscount1Percent = $detail['discount1_percent'] ?? 0;
                $itemDiscount1Amount = ($amount * $itemDiscount1Percent) / 100;
                $afterDiscount1 = $amount - $itemDiscount1Amount;

                // Discount 2 per item
                $itemDiscount2Percent = $detail['discount2_percent'] ?? 0;
                $itemDiscount2Amount = ($afterDiscount1 * $itemDiscount2Percent) / 100;
                $itemSubtotal = $afterDiscount1 - $itemDiscount2Amount;

                $subtotal += $itemSubtotal;

                $detailsData[] = [
                    'item_id' => $detail['item_id'],
                    'item_uom_id' => $detail['item_uom_id'],
                    'quantity' => $detail['quantity'],
                    'price' => $detail['price'],
                    'discount1_percent' => $itemDiscount1Percent,
                    'discount1_amount' => $itemDiscount1Amount,
                    'discount2_percent' => $itemDiscount2Percent,
                    'discount2_amount' => $itemDiscount2Amount,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $discount1Percent = $request->discount1_percent ?? 0;
            $discount1Amount = ($subtotal * $discount1Percent) / 100;

            $afterDiscount1 = $subtotal - $discount1Amount;
            $discount2Percent = $request->discount2_percent ?? 0;
            $discount2Amount = ($afterDiscount1 * $discount2Percent) / 100;

            $totalAfterDiscount = $afterDiscount1 - $discount2Amount;

            $ppnPercent = $request->ppn_percent ?? 0;
            $ppnAmount = ($totalAfterDiscount * $ppnPercent) / 100;

            $totalAmount = $totalAfterDiscount + $ppnAmount;

            // Update purchase
            $purchase->update([
                'supplier_id' => $request->supplier_id,
                'purchase_date' => $request->purchase_date,
                'due_date' => $request->due_date,
                'subtotal' => $subtotal,
                'discount1_percent' => $discount1Percent,
                'discount1_amount' => $discount1Amount,
                'discount2_percent' => $discount2Percent,
                'discount2_amount' => $discount2Amount,
                'total_after_discount' => $totalAfterDiscount,
                'ppn_percent' => $ppnPercent,
                'ppn_amount' => $ppnAmount,
                'total_amount' => $totalAmount,
                'notes' => $request->notes,
            ]);

            // Delete old details and recreate
            $purchase->details()->delete();

            // Create new details
            foreach ($detailsData as $detailData) {
                $purchase->details()->create($detailData);
            }
        });

        return redirect()->route('purchases.index')
            ->with('success', 'Pembelian berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Purchase $purchase): RedirectResponse
    {
        // Only allow delete if status is pending
        if ($purchase->status === 'confirmed') {
            return redirect()->route('purchases.index')
                ->with('error', 'Pembelian yang sudah dikonfirmasi tidak dapat dihapus.');
        }

        $purchase->delete();

        return redirect()->route('purchases.index')
            ->with('success', 'Pembelian berhasil dihapus.');
    }

    /**
     * Confirm purchase - add stock
     */
    public function confirm(Purchase $purchase): RedirectResponse
    {
        if ($purchase->status === 'confirmed') {
            return redirect()->route('purchases.show', $purchase)
                ->with('error', 'Pembelian sudah dikonfirmasi.');
        }

        $this->stockService->confirmPurchase($purchase);

        return redirect()->route('purchases.show', $purchase)
            ->with('success', 'Pembelian berhasil dikonfirmasi. Stock sudah masuk.');
    }

    /**
     * Unconfirm purchase - remove stock
     */
    public function unconfirm(Purchase $purchase): RedirectResponse
    {
        if ($purchase->status === 'pending') {
            return redirect()->route('purchases.show', $purchase)
                ->with('error', 'Pembelian belum dikonfirmasi.');
        }

        $this->stockService->unconfirmPurchase($purchase);

        return redirect()->route('purchases.show', $purchase)
            ->with('success', 'Konfirmasi pembelian dibatalkan. Stock dikembalikan.');
    }
}
