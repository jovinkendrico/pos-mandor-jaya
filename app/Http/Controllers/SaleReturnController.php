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
    public function index(\Illuminate\Http\Request $request): Response
    {
        $query = SaleReturn::with(['sale.customer', 'details.item', 'details.itemUom']);

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('return_number', 'like', "%{$search}%")
                    ->orWhere('reason', 'like', "%{$search}%")
                    ->orWhereHas('sale', function ($q) use ($search) {
                        $q->where('sale_number', 'like', "%{$search}%")
                            ->orWhereHas('customer', function ($q) use ($search) {
                                $q->where('name', 'like', "%{$search}%");
                            });
                    });
            });
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('return_date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('return_date', '<=', $request->date_to);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by return type
        if ($request->has('return_type') && $request->return_type !== 'all') {
            $query->where('return_type', $request->return_type);
        }

        // Filter by customer
        if ($request->has('customer_id') && $request->customer_id) {
            $query->whereHas('sale', function ($q) use ($request) {
                $q->where('customer_id', $request->customer_id);
            });
        }

        // Sorting
        $sortBy    = $request->get('sort_by', 'return_date');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = ['return_date', 'return_number', 'total_amount', 'status'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('return_date', 'desc');
        }
        $query->orderBy('id', 'desc');

        $returns = $query->paginate(10)->withQueryString();

        // Get customers for filter
        $customers = \App\Models\Customer::orderBy('name')->get(['id', 'name']);

        return Inertia::render('transaction/salereturn/index', [
            'returns'   => $returns,
            'customers' => $customers,
            'filters'   => [
                'search'      => $request->get('search', ''),
                'date_from'   => $request->get('date_from', ''),
                'date_to'     => $request->get('date_to', ''),
                'status'      => $request->get('status', 'all'),
                'return_type' => $request->get('return_type', 'all'),
                'customer_id' => $request->get('customer_id', ''),
                'sort_by'     => $sortBy,
                'sort_order'  => $sortOrder,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Get confirmed sales only - minimal data for dropdown
        $sales = Sale::with(['customer:id,name'])
            ->where('status', 'confirmed')
            ->select('id', 'sale_number', 'customer_id', 'sale_date')
            ->orderBy('sale_date', 'desc')
            ->get();

        // Removed: moved to getSaleDetails JSON endpoint to avoid N+1 and large initial payload
        $returnedQuantities = [];

        // Get banks for refund selection
        $banks = \App\Models\Bank::orderBy('name')->get();

        return Inertia::render('transaction/salereturn/create', [
            'sales'              => $sales,
            'returnedQuantities' => $returnedQuantities,
            'banks'              => $banks,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSaleReturnRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            // Calculate totals from items (same logic as sale)
            $subtotal             = 0;
            $totalDiscount1Amount = 0;
            $totalDiscount2Amount = 0;
            $detailsData          = [];

            foreach ($request->details as $detail) {
                $amount = $detail['quantity'] * $detail['price'];

                $itemDiscount1Percent = $detail['discount1_percent'] ?? 0;
                $itemDiscount1Amount  = ($amount * $itemDiscount1Percent) / 100;
                $afterDiscount1       = $amount - $itemDiscount1Amount;

                $itemDiscount2Percent = $detail['discount2_percent'] ?? 0;
                $itemDiscount2Amount  = ($afterDiscount1 * $itemDiscount2Percent) / 100;
                $itemSubtotal         = $afterDiscount1 - $itemDiscount2Amount;

                $subtotal             += $amount;
                $totalDiscount1Amount += $itemDiscount1Amount;
                $totalDiscount2Amount += $itemDiscount2Amount;

                $detailsData[] = [
                    'sale_detail_id'    => $detail['sale_detail_id'] ?? null,
                    'item_id'           => $detail['item_id'],
                    'item_uom_id'       => $detail['item_uom_id'],
                    'quantity'          => $detail['quantity'],
                    'price'             => $detail['price'],
                    'discount1_percent' => $itemDiscount1Percent,
                    'discount1_amount'  => $itemDiscount1Amount,
                    'discount2_percent' => $itemDiscount2Percent,
                    'discount2_amount'  => $itemDiscount2Amount,
                    'subtotal'          => $itemSubtotal,
                    'cost'              => 0,
                    'profit_adjustment' => 0,
                ];
            }

            $discount1Amount  = $totalDiscount1Amount;
            $discount1Percent = $subtotal > 0 ? ($discount1Amount / $subtotal) * 100 : 0;

            $afterDiscount1   = $subtotal - $discount1Amount;
            $discount2Amount  = $totalDiscount2Amount;
            $discount2Percent = $afterDiscount1 > 0 ? ($discount2Amount / $afterDiscount1) * 100 : 0;

            $totalAfterDiscount = $afterDiscount1 - $discount2Amount;

            $ppnPercent = $request->ppn_percent ?? 0;
            $ppnAmount  = ($totalAfterDiscount * $ppnPercent) / 100;

            $totalAmount = $totalAfterDiscount + $ppnAmount;

            $saleReturn = SaleReturn::create([
                'return_number'           => SaleReturn::generateReturnNumber($request->return_date),
                'sale_id'                 => $request->sale_id,
                'return_date'             => $request->return_date,
                'subtotal'                => $subtotal,
                'discount1_percent'       => $discount1Percent,
                'discount1_amount'        => $discount1Amount,
                'discount2_percent'       => $discount2Percent,
                'discount2_amount'        => $discount2Amount,
                'total_after_discount'    => $totalAfterDiscount,
                'ppn_percent'             => $ppnPercent,
                'ppn_amount'              => $ppnAmount,
                'total_amount'            => $totalAmount,
                'total_cost'              => 0,
                'total_profit_adjustment' => 0,
                'status'                  => 'pending',
                'return_type'             => $request->return_type ?? 'stock_only',
                'refund_bank_id'          => $request->refund_bank_id ?? null,
                'refund_method'           => $request->refund_method ?? null,
                'reason'                  => $request->reason,
                'allocations'             => $request->allocations,
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
        $saleReturn->load(['sale.customer', 'details.item', 'details.itemUom.uom']);

        return Inertia::render('transaction/salereturn/show', [
            'saleReturn' => $saleReturn,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SaleReturn $saleReturn): Response
    {
        if ($saleReturn->status === 'confirmed') {
            return Inertia::render('transaction/salereturn/show', [
                'saleReturn' => $saleReturn->load(['sale.customer', 'details.item', 'details.itemUom.uom']),
                'error' => 'Retur yang sudah dikonfirmasi tidak dapat diedit. Batalkan konfirmasi terlebih dahulu.',
            ]);
        }

        $saleReturn->load(['details.item', 'details.itemUom.uom']);

        // Get confirmed sales only
        $sales = Sale::with(['customer:id,name'])
            ->where('status', 'confirmed')
            ->select('id', 'sale_number', 'customer_id', 'sale_date')
            ->orderBy('sale_date', 'desc')
            ->get();

        // Get banks for refund selection
        $banks = \App\Models\Bank::orderBy('name')->get();

        return Inertia::render('transaction/salereturn/edit', [
            'saleReturn' => $saleReturn,
            'sales'       => $sales,
            'banks'       => $banks,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StoreSaleReturnRequest $request, SaleReturn $saleReturn): RedirectResponse
    {
        if ($saleReturn->status === 'confirmed') {
            return redirect()->route('sale-returns.show', $saleReturn)
                ->with('error', 'Retur yang sudah dikonfirmasi tidak dapat diupdate.');
        }

        DB::transaction(function () use ($request, $saleReturn) {
            // Calculate totals from items
            $subtotal             = 0;
            $totalDiscount1Amount = 0;
            $totalDiscount2Amount = 0;
            $detailsData          = [];

            foreach ($request->details as $detail) {
                $amount = $detail['quantity'] * $detail['price'];

                $itemDiscount1Percent = $detail['discount1_percent'] ?? 0;
                $itemDiscount1Amount  = ($amount * $itemDiscount1Percent) / 100;
                $afterDiscount1       = $amount - $itemDiscount1Amount;

                $itemDiscount2Percent = $detail['discount2_percent'] ?? 0;
                $itemDiscount2Amount  = ($afterDiscount1 * $itemDiscount2Percent) / 100;
                $itemSubtotal         = $afterDiscount1 - $itemDiscount2Amount;

                $subtotal             += $amount;
                $totalDiscount1Amount += $itemDiscount1Amount;
                $totalDiscount2Amount += $itemDiscount2Amount;

                $detailsData[] = [
                    'sale_detail_id'    => $detail['sale_detail_id'] ?? null,
                    'item_id'           => $detail['item_id'],
                    'item_uom_id'       => $detail['item_uom_id'],
                    'quantity'          => $detail['quantity'],
                    'price'             => $detail['price'],
                    'discount1_percent' => $itemDiscount1Percent,
                    'discount1_amount'  => $itemDiscount1Amount,
                    'discount2_percent' => $itemDiscount2Percent,
                    'discount2_amount'  => $itemDiscount2Amount,
                    'subtotal'          => $itemSubtotal,
                    'cost'              => 0,
                    'profit_adjustment' => 0,
                ];
            }

            $discount1Amount  = $totalDiscount1Amount;
            $discount1Percent = $subtotal > 0 ? ($discount1Amount / $subtotal) * 100 : 0;

            $afterDiscount1   = $subtotal - $discount1Amount;
            $discount2Amount  = $totalDiscount2Amount;
            $discount2Percent = $afterDiscount1 > 0 ? ($discount2Amount / $afterDiscount1) * 100 : 0;

            $totalAfterDiscount = $afterDiscount1 - $discount2Amount;

            $ppnPercent = $request->ppn_percent ?? 0;
            $ppnAmount  = ($totalAfterDiscount * $ppnPercent) / 100;

            $totalAmount = $totalAfterDiscount + $ppnAmount;

            $saleReturn->update([
                'sale_id'              => $request->sale_id,
                'return_date'          => $request->return_date,
                'subtotal'             => $subtotal,
                'discount1_percent'    => $discount1Percent,
                'discount1_amount'     => $discount1Amount,
                'discount2_percent'    => $discount2Percent,
                'discount2_amount'     => $discount2Amount,
                'total_after_discount' => $totalAfterDiscount,
                'ppn_percent'          => $ppnPercent,
                'ppn_amount'           => $ppnAmount,
                'total_amount'         => $totalAmount,
                'return_type'          => $request->return_type ?? 'stock_only',
                'refund_bank_id'       => $request->refund_bank_id ?? null,
                'refund_method'        => $request->refund_method ?? null,
                'reason'               => $request->reason,
                'allocations'          => $request->allocations,
            ]);

            // Delete old details and create new ones
            $saleReturn->details()->delete();
            foreach ($detailsData as $detailData) {
                $saleReturn->details()->create($detailData);
            }
        });

        return redirect()->route('sale-returns.show', $saleReturn)
            ->with('success', 'Retur penjualan berhasil diupdate.');
    }

    /**
     * Get sale details via AJAX for return form
     */
    public function getSaleDetails(Sale $sale)
    {
        $sale->load(['details.item', 'details.itemUom.uom']);

        $returnedQuantities = [];
        foreach ($sale->details as $detail) {
            $totalReturned = \App\Models\SaleReturnDetail::where('sale_detail_id', $detail->id)
                ->whereHas('saleReturn', function ($query) {
                    $query->where('status', 'confirmed');
                })
                ->sum('quantity');

            $returnedQuantities[$detail->id] = (float) $totalReturned;
        }

        return response()->json([
            'sale' => $sale,
            'returnedQuantities' => $returnedQuantities,
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

        try {
            $this->stockService->confirmSaleReturn($saleReturn);

            return redirect()->route('sale-returns.show', $saleReturn)
                ->with('success', 'Retur penjualan dikonfirmasi. Stock telah dikembalikan.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Sale Return Confirmation Error', [
                'sale_return_id' => $saleReturn->id,
                'error' => $e->getMessage()
            ]);

            return redirect()->route('sale-returns.show', $saleReturn)
                ->with('error', 'Gagal Konfirmasi: ' . $e->getMessage());
        }
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
     * Print sale return for dot matrix printer (QZ Print)
     */
    public function printDotMatrix(\Illuminate\Http\Request $request)
    {
        try {
            $saleReturnId = $request->input('sale_return_id');

            if (!$saleReturnId) {
                return response()->json(['error' => 'Sale return ID is required'], 400);
            }

            $saleReturn = SaleReturn::with([
                'sale.customer.city',
                'details.item',
                'details.itemUom.uom'
            ])->findOrFail($saleReturnId);

            // Return HTML view for QZ Print to process
            return view('pdf.sale-return', [
                'title' => 'RJ - ' . $saleReturn->return_number,
                'saleReturn' => $saleReturn,
            ]);
        } catch (\Exception $e) {
            \Log::error('Print Dot Matrix Sale Return - Exception caught', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'error' => 'Error generating print: ' . $e->getMessage()
            ], 500);
        }
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

    /**
     * Get outstanding sales for a customer for "Potong Bon"
     */
    public function getOutstandingSales(\App\Models\Customer $customer)
    {
        $sales = \App\Models\Sale::where('customer_id', $customer->id)
            ->whereIn('status', ['confirmed', 'partially_paid'])
            ->where('remaining_amount', '>', 0)
            ->select('id', 'sale_number', 'sale_date', 'total_amount', 'remaining_amount')
            ->orderBy('sale_date', 'asc')
            ->get();

        return response()->json($sales);
    }
}
