<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\UpdateSaleRequest;
use App\Models\Sale;
use App\Models\Customer;
use App\Models\Item;
use App\Services\StockService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
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
        $sales = Sale::with(['customer', 'details.item', 'details.itemUom'])
            ->orderBy('sale_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('transaction/sale/index', [
            'sales' => [
                'data' => $sales,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $customers = Customer::orderBy('name')->limit(10)->get();
        $items = Item::with('uoms')->where('stock', '>', 0)->orderBy('name')->get();

        return Inertia::render('transaction/sale/create', [
            'customers' => $customers,
            'items' => $items,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSaleRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            // Calculate totals dari semua items
            $subtotal = 0;
            $totalDiscount1Amount = 0;
            $totalDiscount2Amount = 0;
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

                $subtotal += $amount; // Sum all amounts before discount
                $totalDiscount1Amount += $itemDiscount1Amount;
                $totalDiscount2Amount += $itemDiscount2Amount;

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
                    'cost' => 0,
                    'profit' => 0,
                ];
            }

            // Header discount calculated from sum of item discounts
            $discount1Amount = $totalDiscount1Amount;
            $discount1Percent = $subtotal > 0 ? ($discount1Amount / $subtotal) * 100 : 0;

            // Calculate discount 2 (applied after discount 1)
            $afterDiscount1 = $subtotal - $discount1Amount;
            $discount2Amount = $totalDiscount2Amount;
            $discount2Percent = $afterDiscount1 > 0 ? ($discount2Amount / $afterDiscount1) * 100 : 0;

            $totalAfterDiscount = $afterDiscount1 - $discount2Amount;

            // Calculate PPN
            $ppnPercent = $request->ppn_percent ?? 0;
            $ppnAmount = ($totalAfterDiscount * $ppnPercent) / 100;

            $totalAmount = $totalAfterDiscount + $ppnAmount;

            // Create sale
            $sale = Sale::create([
                'sale_number' => Sale::generateSaleNumber(),
                'customer_id' => $request->customer_id,
                'sale_date' => $request->sale_date,
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
                'total_cost' => 0, // Will be calculated on confirm
                'total_profit' => 0, // Will be calculated on confirm
                'status' => 'pending',
                'notes' => $request->notes,
            ]);

            // Create sale details
            foreach ($detailsData as $detailData) {
                $sale->details()->create($detailData);
            }
        });

        return redirect()->route('sales.index')
            ->with('success', 'Penjualan berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Sale $sale): Response
    {
        $sale->load(['customer', 'details.item', 'details.itemUom']);

        return Inertia::render('transaction/sale/show', [
            'sale' => $sale,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Sale $sale): Response
    {
        // Only allow edit if status is pending
        if ($sale->status === 'confirmed') {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Penjualan yang sudah dikonfirmasi tidak dapat diedit.');
        }

        $sale->load(['details.item', 'details.itemUom']);
        $customers = Customer::orderBy('name')->limit(10)->get();
        $items = Item::with('uoms')->where('stock', '>', 0)->orderBy('name')->get();

        return Inertia::render('transaction/sale/edit', [
            'sale' => $sale,
            'customers' => $customers,
            'items' => $items,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSaleRequest $request, Sale $sale): RedirectResponse
    {
        // Only allow update if status is pending
        if ($sale->status === 'confirmed') {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Penjualan yang sudah dikonfirmasi tidak dapat diedit.');
        }

        DB::transaction(function () use ($request, $sale) {
            // Calculate totals dari semua items (same as store)
            $subtotal = 0;
            $totalDiscount1Amount = 0;
            $totalDiscount2Amount = 0;
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

                $subtotal += $amount; // Sum all amounts before discount
                $totalDiscount1Amount += $itemDiscount1Amount;
                $totalDiscount2Amount += $itemDiscount2Amount;

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
                    'cost' => 0,
                    'profit' => 0,
                ];
            }

            // Header discount calculated from sum of item discounts
            $discount1Amount = $totalDiscount1Amount;
            $discount1Percent = $subtotal > 0 ? ($discount1Amount / $subtotal) * 100 : 0;

            $afterDiscount1 = $subtotal - $discount1Amount;
            $discount2Amount = $totalDiscount2Amount;
            $discount2Percent = $afterDiscount1 > 0 ? ($discount2Amount / $afterDiscount1) * 100 : 0;

            $totalAfterDiscount = $afterDiscount1 - $discount2Amount;

            $ppnPercent = $request->ppn_percent ?? 0;
            $ppnAmount = ($totalAfterDiscount * $ppnPercent) / 100;

            $totalAmount = $totalAfterDiscount + $ppnAmount;

            // Update sale
            $sale->update([
                'customer_id' => $request->customer_id,
                'sale_date' => $request->sale_date,
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
            $sale->details()->delete();

            // Create new details
            foreach ($detailsData as $detailData) {
                $sale->details()->create($detailData);
            }
        });

        return redirect()->route('sales.index')
            ->with('success', 'Penjualan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sale $sale): RedirectResponse
    {
        // Only allow delete if status is pending
        if ($sale->status === 'confirmed') {
            return redirect()->route('sales.index')
                ->with('error', 'Penjualan yang sudah dikonfirmasi tidak dapat dihapus.');
        }

        $sale->delete();

        return redirect()->route('sales.index')
            ->with('success', 'Penjualan berhasil dihapus.');
    }

    /**
     * Confirm sale - deduct stock and calculate FIFO profit
     */
    public function confirm(Sale $sale): RedirectResponse
    {
        if ($sale->status === 'confirmed') {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Penjualan sudah dikonfirmasi.');
        }

        // Check stock availability
        foreach ($sale->details as $detail) {
            $baseQty = $detail->quantity * $detail->itemUom->conversion_value;
            if ($detail->item->stock < $baseQty) {
                return redirect()->route('sales.show', $sale)
                    ->with('error', "Stock {$detail->item->name} tidak mencukupi.");
            }
        }

        $this->stockService->confirmSale($sale);

        return redirect()->route('sales.show', $sale)
            ->with('success', 'Penjualan berhasil dikonfirmasi. Profit sudah dihitung dengan FIFO.');
    }

    /**
     * Unconfirm sale - restore stock
     */
    public function unconfirm(Sale $sale): RedirectResponse
    {
        if ($sale->status === 'pending') {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Penjualan belum dikonfirmasi.');
        }

        $this->stockService->unconfirmSale($sale);

        return redirect()->route('sales.show', $sale)
            ->with('success', 'Konfirmasi penjualan dibatalkan. Stock dikembalikan.');
    }
}
