<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseReturnRequest;
use App\Models\PurchaseReturn;
use App\Models\Purchase;
use App\Services\StockService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class PurchaseReturnController extends Controller
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
        $query = PurchaseReturn::with(['purchase.supplier', 'details.item', 'details.itemUom']);

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('return_number', 'like', "%{$search}%")
                    ->orWhere('reason', 'like', "%{$search}%")
                    ->orWhereHas('purchase', function ($q) use ($search) {
                        $q->where('purchase_number', 'like', "%{$search}%")
                            ->orWhereHas('supplier', function ($q) use ($search) {
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

        // Filter by supplier
        if ($request->has('supplier_id') && $request->supplier_id) {
            $query->whereHas('purchase', function ($q) use ($request) {
                $q->where('supplier_id', $request->supplier_id);
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

        $returns = $query->paginate(15)->withQueryString();

        // Get suppliers for filter
        $suppliers = \App\Models\Supplier::orderBy('name')->get(['id', 'name']);

        return Inertia::render('transaction/purchasereturn/index', [
            'returns'   => $returns,
            'suppliers' => $suppliers,
            'filters'   => [
                'search'      => $request->get('search', ''),
                'date_from'   => $request->get('date_from', ''),
                'date_to'     => $request->get('date_to', ''),
                'status'      => $request->get('status', 'all'),
                'return_type' => $request->get('return_type', 'all'),
                'supplier_id' => $request->get('supplier_id', ''),
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
        // Get confirmed purchases only
        $purchases = Purchase::with(['supplier', 'details.item', 'details.itemUom.uom'])
            ->where('status', 'confirmed')
            ->orderBy('purchase_date', 'desc')
            ->get();

        // Get already returned quantities for each purchase detail
        $returnedQuantities = [];
        foreach ($purchases as $purchase) {
            foreach ($purchase->details as $detail) {
                $totalReturned = \App\Models\PurchaseReturnDetail::where('purchase_detail_id', $detail->id)
                    ->whereHas('purchaseReturn', function ($query) {
                        $query->where('status', 'confirmed');
                    })
                    ->sum('quantity');

                $returnedQuantities[$detail->id] = (float) $totalReturned;
            }
        }

        // Get banks for refund selection
        $banks = \App\Models\Bank::orderBy('name')->get();

        return Inertia::render('transaction/purchasereturn/create', [
            'purchases'          => $purchases,
            'returnedQuantities' => $returnedQuantities,
            'banks'              => $banks,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePurchaseReturnRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            // Calculate totals from items (same logic as purchase)
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
                    'purchase_detail_id' => $detail['purchase_detail_id'] ?? null,
                    'item_id'            => $detail['item_id'],
                    'item_uom_id'        => $detail['item_uom_id'],
                    'quantity'           => $detail['quantity'],
                    'price'              => $detail['price'],
                    'discount1_percent'  => $itemDiscount1Percent,
                    'discount1_amount'   => $itemDiscount1Amount,
                    'discount2_percent'  => $itemDiscount2Percent,
                    'discount2_amount'   => $itemDiscount2Amount,
                    'subtotal'           => $itemSubtotal,
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

            $purchaseReturn = PurchaseReturn::create([
                'return_number'        => PurchaseReturn::generateReturnNumber($request->return_date),
                'purchase_id'          => $request->purchase_id,
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
                'status'               => 'pending',
                'return_type'          => $request->return_type ?? 'stock_only',
                'refund_bank_id'       => $request->refund_bank_id ?? null,
                'refund_method'        => $request->refund_method ?? null,
                'reason'               => $request->reason,
            ]);

            foreach ($detailsData as $detailData) {
                $purchaseReturn->details()->create($detailData);
            }
        });

        return redirect()->route('purchase-returns.index')
            ->with('success', 'Retur pembelian berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(PurchaseReturn $purchaseReturn): Response
    {
        $purchaseReturn->load(['purchase.supplier', 'details.item', 'details.itemUom.uom']);

        return Inertia::render('transaction/purchasereturn/show', [
            'purchase_return' => $purchaseReturn,
        ]);
    }

    /**
     * Confirm the return (reduce stock)
     */
    public function confirm(PurchaseReturn $purchaseReturn): RedirectResponse
    {
        if ($purchaseReturn->status === 'confirmed') {
            return redirect()->route('purchase-returns.show', $purchaseReturn)
                ->with('error', 'Retur pembelian sudah dikonfirmasi.');
        }

        $this->stockService->confirmPurchaseReturn($purchaseReturn);

        return redirect()->route('purchase-returns.show', $purchaseReturn)
            ->with('success', 'Retur pembelian dikonfirmasi. Stock telah dikurangi.');
    }

    /**
     * Unconfirm the return (restore stock)
     */
    public function unconfirm(PurchaseReturn $purchaseReturn): RedirectResponse
    {
        if ($purchaseReturn->status === 'pending') {
            return redirect()->route('purchase-returns.show', $purchaseReturn)
                ->with('error', 'Retur pembelian belum dikonfirmasi.');
        }

        $this->stockService->unconfirmPurchaseReturn($purchaseReturn);

        return redirect()->route('purchase-returns.show', $purchaseReturn)
            ->with('success', 'Konfirmasi retur pembelian dibatalkan. Stock telah dikembalikan.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PurchaseReturn $purchaseReturn): RedirectResponse
    {
        if ($purchaseReturn->status === 'confirmed') {
            return redirect()->route('purchase-returns.index')
                ->with('error', 'Retur pembelian yang sudah dikonfirmasi tidak dapat dihapus.');
        }

        $purchaseReturn->delete();

        return redirect()->route('purchase-returns.index')
            ->with('success', 'Retur pembelian berhasil dihapus.');
    }
}
