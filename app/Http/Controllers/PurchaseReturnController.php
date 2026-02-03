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

        $returns = $query->paginate(10)->withQueryString();

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
        // Get confirmed purchases only - minimal data for dropdown
        $purchases = Purchase::with(['supplier:id,name'])
            ->where('status', 'confirmed')
            ->select('id', 'purchase_number', 'supplier_id', 'purchase_date')
            ->orderBy('purchase_date', 'desc')
            ->get();

        // Removed: moved to getPurchaseDetails JSON endpoint to avoid N+1 and large initial payload
        $returnedQuantities = [];

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
                'allocations'          => $request->allocations,
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

        // Load allocated purchase details if any
        $allocatedPurchases = [];
        if ($purchaseReturn->allocations) {
            $purchaseIds = collect($purchaseReturn->allocations)->pluck('purchase_id')->filter()->unique();
            $allocatedPurchases = \App\Models\Purchase::whereIn('id', $purchaseIds)
                ->select('id', 'purchase_number', 'purchase_date')
                ->get()
                ->keyBy('id');
        }

        return Inertia::render('transaction/purchasereturn/show', [
            'purchaseReturn'     => $purchaseReturn,
            'allocatedPurchases' => $allocatedPurchases,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PurchaseReturn $purchaseReturn): Response
    {
        if ($purchaseReturn->status === 'confirmed') {
            return Inertia::render('transaction/purchasereturn/show', [
                'purchaseReturn' => $purchaseReturn->load(['purchase.supplier', 'details.item', 'details.itemUom.uom']),
                'error' => 'Retur yang sudah dikonfirmasi tidak dapat diedit. Batalkan konfirmasi terlebih dahulu.',
            ]);
        }

        $purchaseReturn->load(['details.item', 'details.itemUom.uom']);

        // Get confirmed purchases only
        $purchases = Purchase::with(['supplier:id,name'])
            ->where('status', 'confirmed')
            ->select('id', 'purchase_number', 'supplier_id', 'purchase_date')
            ->orderBy('purchase_date', 'desc')
            ->get();

        // Get banks for refund selection
        $banks = \App\Models\Bank::orderBy('name')->get();

        return Inertia::render('transaction/purchasereturn/edit', [
            'purchaseReturn' => $purchaseReturn,
            'purchases'      => $purchases,
            'banks'          => $banks,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StorePurchaseReturnRequest $request, PurchaseReturn $purchaseReturn): RedirectResponse
    {
        if ($purchaseReturn->status === 'confirmed') {
            return redirect()->route('purchase-returns.show', $purchaseReturn)
                ->with('error', 'Retur yang sudah dikonfirmasi tidak dapat diupdate.');
        }

        DB::transaction(function () use ($request, $purchaseReturn) {
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

            $purchaseReturn->update([
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
                'return_type'          => $request->return_type ?? 'stock_only',
                'refund_bank_id'       => $request->refund_bank_id ?? null,
                'refund_method'        => $request->refund_method ?? null,
                'reason'               => $request->reason,
                'allocations'          => $request->allocations,
            ]);

            // Delete old details and create new ones
            $purchaseReturn->details()->delete();
            foreach ($detailsData as $detailData) {
                $purchaseReturn->details()->create($detailData);
            }
        });

        return redirect()->route('purchase-returns.show', $purchaseReturn)
            ->with('success', 'Retur pembelian berhasil diupdate.');
    }

    /**
     * Get purchase details via AJAX for return form
     */
    public function getPurchaseDetails(Purchase $purchase)
    {
        $purchase->load(['details.item', 'details.itemUom.uom']);

        $returnedQuantities = [];
        foreach ($purchase->details as $detail) {
            $totalReturned = \App\Models\PurchaseReturnDetail::where('purchase_detail_id', $detail->id)
                ->whereHas('purchaseReturn', function ($query) {
                    $query->where('status', 'confirmed');
                })
                ->sum('quantity');

            $returnedQuantities[$detail->id] = (float) $totalReturned;
        }

        return response()->json([
            'purchase' => $purchase,
            'returnedQuantities' => $returnedQuantities,
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

        try {
            $this->stockService->confirmPurchaseReturn($purchaseReturn);

            return redirect()->route('purchase-returns.show', $purchaseReturn)
                ->with('success', 'Retur pembelian dikonfirmasi. Stock telah dikurangi.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Purchase Return Confirmation Error', [
                'purchase_return_id' => $purchaseReturn->id,
                'error' => $e->getMessage()
            ]);

            return redirect()->route('purchase-returns.show', $purchaseReturn)
                ->with('error', 'Gagal Konfirmasi: ' . $e->getMessage());
        }
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
     * Print purchase return for dot matrix printer (QZ Print)
     */
    public function printDotMatrix(\Illuminate\Http\Request $request)
    {
        try {
            $purchaseReturnId = $request->input('purchase_return_id');

            if (!$purchaseReturnId) {
                return response()->json(['error' => 'Purchase return ID is required'], 400);
            }

            $purchaseReturn = PurchaseReturn::with([
                'purchase.supplier.city',
                'details.item',
                'details.itemUom.uom'
            ])->findOrFail($purchaseReturnId);

            // Return HTML view for QZ Print to process
            return view('pdf.purchase-return', [
                'title' => 'RB - ' . $purchaseReturn->return_number,
                'purchaseReturn' => $purchaseReturn,
            ]);
        } catch (\Exception $e) {
            \Log::error('Print Dot Matrix Purchase Return - Exception caught', [
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

    /**
     * Get outstanding purchases for a supplier for "Potong Bon"
     */
    public function getOutstandingPurchases(\App\Models\Supplier $supplier, \Illuminate\Http\Request $request)
    {
        $excludeReturnId = $request->input('exclude_return_id');

        // 1. Fetch confirmed/partially_paid purchases
        $purchases = \App\Models\Purchase::where('supplier_id', $supplier->id)
            ->whereIn('status', ['confirmed', 'partially_paid'])
            ->orderBy('purchase_date', 'asc')
            ->get();

        // 2. Filter by remaining_amount and handle excludeReturnId
        $results = $purchases->filter(function($p) {
            return $p->remaining_amount > 0;
        })->values();

        if ($excludeReturnId) {
            $currentReturn = \App\Models\PurchaseReturn::find($excludeReturnId);
            if ($currentReturn && $currentReturn->allocations) {
                $allocations = is_array($currentReturn->allocations) 
                    ? $currentReturn->allocations 
                    : json_decode($currentReturn->allocations, true);
                
                foreach ($allocations as $allocation) {
                    $purchaseId = $allocation['purchase_id'] ?? null;
                    $amount = $allocation['amount'] ?? 0;
                    
                    if (!$purchaseId) continue;

                    $existing = $results->where('id', $purchaseId)->first();
                    if ($existing) {
                        $existing->remaining_amount = (float) $existing->remaining_amount + (float) $amount;
                    } else {
                        // If not in the list (remaining was 0), fetch it and add it
                        $p = \App\Models\Purchase::find($purchaseId);
                        if ($p) {
                            $p->remaining_amount = (float) $p->remaining_amount + (float) $amount;
                            $results->push($p);
                        }
                    }
                }
            }
        }

        return response()->json($results->values());
    }
}
