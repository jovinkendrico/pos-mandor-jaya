<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleReturnRequest;
use App\Models\SaleReturn;
use App\Models\Sale;
use App\Services\StockService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class SaleReturnController extends Controller
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
        $returns = SaleReturn::with(['sale.customer', 'details.item', 'details.itemUom'])
            ->orderBy('return_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('transaction/salereturn/index', [
            'returns' => [
                'data' => $returns,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Get confirmed sales only
        $sales = Sale::with(['customer', 'details.item', 'details.itemUom'])
            ->where('status', 'confirmed')
            ->orderBy('sale_date', 'desc')
            ->get();

        return Inertia::render('transaction/salereturn/create', [
            'sales' => $sales,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSaleReturnRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            // Calculate totals from items (same logic as sale)
            $subtotal = 0;
            $totalDiscount1Amount = 0;
            $totalDiscount2Amount = 0;
            $detailsData = [];

            foreach ($request->details as $detail) {
                $amount = $detail['quantity'] * $detail['price'];
                
                $itemDiscount1Percent = $detail['discount1_percent'] ?? 0;
                $itemDiscount1Amount = ($amount * $itemDiscount1Percent) / 100;
                $afterDiscount1 = $amount - $itemDiscount1Amount;
                
                $itemDiscount2Percent = $detail['discount2_percent'] ?? 0;
                $itemDiscount2Amount = ($afterDiscount1 * $itemDiscount2Percent) / 100;
                $itemSubtotal = $afterDiscount1 - $itemDiscount2Amount;

                $subtotal += $amount;
                $totalDiscount1Amount += $itemDiscount1Amount;
                $totalDiscount2Amount += $itemDiscount2Amount;

                $detailsData[] = [
                    'sale_detail_id' => $detail['sale_detail_id'] ?? null,
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
                    'profit_adjustment' => 0,
                ];
            }

            $discount1Amount = $totalDiscount1Amount;
            $discount1Percent = $subtotal > 0 ? ($discount1Amount / $subtotal) * 100 : 0;

            $afterDiscount1 = $subtotal - $discount1Amount;
            $discount2Amount = $totalDiscount2Amount;
            $discount2Percent = $afterDiscount1 > 0 ? ($discount2Amount / $afterDiscount1) * 100 : 0;

            $totalAfterDiscount = $afterDiscount1 - $discount2Amount;

            $ppnPercent = $request->ppn_percent ?? 0;
            $ppnAmount = ($totalAfterDiscount * $ppnPercent) / 100;

            $totalAmount = $totalAfterDiscount + $ppnAmount;

            $saleReturn = SaleReturn::create([
                'return_number' => SaleReturn::generateReturnNumber(),
                'sale_id' => $request->sale_id,
                'return_date' => $request->return_date,
                'subtotal' => $subtotal,
                'discount1_percent' => $discount1Percent,
                'discount1_amount' => $discount1Amount,
                'discount2_percent' => $discount2Percent,
                'discount2_amount' => $discount2Amount,
                'total_after_discount' => $totalAfterDiscount,
                'ppn_percent' => $ppnPercent,
                'ppn_amount' => $ppnAmount,
                'total_amount' => $totalAmount,
                'total_cost' => 0,
                'total_profit_adjustment' => 0,
                'status' => 'pending',
                'reason' => $request->reason,
            ]);

            foreach ($detailsData as $detailData) {
                $saleReturn->details()->create($detailData);
            }
        });

        return redirect()->route('sale-returns.index')
            ->with('success', 'Retur penjualan berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(SaleReturn $saleReturn): Response
    {
        $saleReturn->load(['sale.customer', 'details.item', 'details.itemUom']);

        return Inertia::render('transaction/salereturn/show', [
            'return' => $saleReturn,
        ]);
    }

    /**
     * Confirm the return (add stock back & adjust profit)
     */
    public function confirm(SaleReturn $saleReturn): RedirectResponse
    {
        if ($saleReturn->status === 'confirmed') {
            return redirect()->route('sale-returns.show', $saleReturn)
                ->with('error', 'Retur penjualan sudah dikonfirmasi.');
        }

        $this->stockService->confirmSaleReturn($saleReturn);

        return redirect()->route('sale-returns.show', $saleReturn)
            ->with('success', 'Retur penjualan dikonfirmasi. Stock telah dikembalikan.');
    }

    /**
     * Unconfirm the return (remove returned stock)
     */
    public function unconfirm(SaleReturn $saleReturn): RedirectResponse
    {
        if ($saleReturn->status === 'pending') {
            return redirect()->route('sale-returns.show', $saleReturn)
                ->with('error', 'Retur penjualan belum dikonfirmasi.');
        }

        $this->stockService->unconfirmSaleReturn($saleReturn);

        return redirect()->route('sale-returns.show', $saleReturn)
            ->with('success', 'Konfirmasi retur penjualan dibatalkan.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SaleReturn $saleReturn): RedirectResponse
    {
        if ($saleReturn->status === 'confirmed') {
            return redirect()->route('sale-returns.index')
                ->with('error', 'Retur penjualan yang sudah dikonfirmasi tidak dapat dihapus.');
        }

        $saleReturn->delete();

        return redirect()->route('sale-returns.index')
            ->with('success', 'Retur penjualan berhasil dihapus.');
    }
}
