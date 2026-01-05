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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

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
    public function index(Request $request): Response
    {
        $query = Purchase::with(['supplier', 'details.item', 'details.itemUom', 'creator', 'updater']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('purchase_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Date range
        if ($request->filled('date_from')) {
            $query->whereDate('purchase_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('purchase_date', '<=', $request->date_to);
        }

        // Sort
        $sortBy    = $request->get('sort_by', 'purchase_date');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = ['purchase_date', 'purchase_number', 'total_amount', 'status'];
        $query->orderBy(in_array($sortBy, $allowedSortFields) ? $sortBy : 'purchase_date', $sortOrder)
            ->orderBy('id', 'desc');

        // Default per-page 10
        $perPage = $request->get('per_page', 10);

        // Query now paginated
        $purchases = $query->paginate($perPage)->withQueryString();

        // Append computed attributes (only for current page)
        $purchases->getCollection()->each->append(['total_paid', 'remaining_amount']);

        // Filter by payment status AFTER append
        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            $filtered = $purchases->getCollection()->filter(function ($purchase) use ($request) {
                return $request->payment_status === 'paid'
                    ? $purchase->remaining_amount <= 0
                    : $purchase->remaining_amount > 0;
            });

            // Replace paginated collection with filtered version
            $purchases->setCollection($filtered->values());
        }

        return Inertia::render('transaction/purchase/index', [
            'purchases' => $purchases,
            'filters'   => [
                'search'         => $request->get('search', ''),
                'status'         => $request->get('status', 'all'),
                'payment_status' => $request->get('payment_status', 'all'),
                'date_from'      => $request->get('date_from', ''),
                'date_to'        => $request->get('date_to', ''),
                'sort_by'        => $sortBy,
                'sort_order'     => $sortOrder,
                'per_page'       => $perPage,
            ],
        ]);
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $suppliers = Supplier::orderBy('name')->get();
        $items     = Item::with('itemUoms.uom')->orderBy('name')->get();

        return Inertia::render('transaction/purchase/create', [
            'suppliers' => $suppliers,
            'items'     => $items,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePurchaseRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            // Calculate totals dari semua items
            $subtotal             = 0;
            $totalDiscount1Amount = 0;
            $totalDiscount2Amount = 0;
            $detailsData          = [];

            foreach ($request->details as $detail) {
                // Calculate per item
                $amount = $detail['quantity'] * $detail['price'];

                // Discount 1 per item
                $itemDiscount1Percent = $detail['discount1_percent'] ?? 0;
                $itemDiscount1Amount  = ($amount * $itemDiscount1Percent) / 100;
                $afterDiscount1       = $amount - $itemDiscount1Amount;

                // Discount 2 per item
                $itemDiscount2Percent = $detail['discount2_percent'] ?? 0;
                $itemDiscount2Amount  = ($afterDiscount1 * $itemDiscount2Percent) / 100;
                $itemSubtotal         = $afterDiscount1 - $itemDiscount2Amount;

                $subtotal             += $amount; // Sum all amounts before discount
                $totalDiscount1Amount += $itemDiscount1Amount;
                $totalDiscount2Amount += $itemDiscount2Amount;

                $detailsData[] = [
                    'item_id'           => $detail['item_id'],
                    'item_uom_id'       => $detail['item_uom_id'],
                    'quantity'          => $detail['quantity'],
                    'price'             => $detail['price'],
                    'discount1_percent' => $itemDiscount1Percent,
                    'discount1_amount'  => $itemDiscount1Amount,
                    'discount2_percent' => $itemDiscount2Percent,
                    'discount2_amount'  => $itemDiscount2Amount,
                    'subtotal'          => $itemSubtotal,
                ];
            }

            // Header discount calculated from sum of item discounts
            $discount1Amount  = $totalDiscount1Amount;
            $discount1Percent = $subtotal > 0 ? ($discount1Amount / $subtotal) * 100 : 0;

            // Calculate discount 2 (applied after discount 1)
            $afterDiscount1   = $subtotal - $discount1Amount;
            $discount2Amount  = $totalDiscount2Amount;
            $discount2Percent = $afterDiscount1 > 0 ? ($discount2Amount / $afterDiscount1) * 100 : 0;

            $totalAfterDiscount = $afterDiscount1 - $discount2Amount;

            // Calculate PPN
            $ppnPercent = $request->ppn_percent ?? 0;
            $ppnAmount  = ($totalAfterDiscount * $ppnPercent) / 100;

            $totalAmount = $totalAfterDiscount + $ppnAmount;

            // Generate purchase number with retry logic to handle race conditions
            $maxRetries = 5;
            $purchase   = null;

            for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
                try {
                    $purchaseNumber = Purchase::generatePurchaseNumber($request->purchase_date);

                    // Create purchase
                    $purchase = Purchase::create([
                        'purchase_number'      => $purchaseNumber,
                        'supplier_id'          => $request->supplier_id,
                        'purchase_date'        => $request->purchase_date,
                        'due_date'             => $request->due_date,
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
                        'notes'                => $request->notes,
                        'created_by'           => auth()->id(),
                        'updated_by'           => auth()->id(),
                    ]);

                    break; // Success, exit retry loop
                } catch (\Illuminate\Database\QueryException $e) {
                    // Check if it's a unique constraint violation (SQLSTATE 23000)
                    if ($e->getCode() == 23000 && (str_contains($e->getMessage(), 'purchase_number') || str_contains($e->getMessage(), 'purchases_purchase_number_unique'))) {
                        if ($attempt === $maxRetries - 1) {
                            throw $e; // Re-throw on last attempt
                        }
                        // Wait a tiny bit before retrying (microseconds)
                        usleep(10000 * ($attempt + 1)); // 10ms, 20ms, 30ms, etc.
                        continue;
                    }
                    throw $e; // Re-throw if it's a different error
                }
            }

            if (!$purchase) {
                throw new \Exception('Failed to create purchase after ' . $maxRetries . ' attempts');
            }

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
        $purchase->load(['supplier', 'details.item', 'details.itemUom.uom', 'creator', 'updater']);

        return Inertia::render('transaction/purchase/show', [
            'purchase' => $purchase,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Purchase $purchase): Response|RedirectResponse
    {
        if ($purchase->status === 'confirmed') {
            return redirect()
                ->route('purchases.show', $purchase)
                ->with('error', 'Pembelian yang sudah dikonfirmasi tidak dapat diedit.');
        }

        $purchase->load(['details.item', 'details.itemUom.uom']);
        $suppliers = Supplier::orderBy('name')->limit(10)->get();
        $items     = Item::with('itemUoms.uom')->orderBy('name')->get();


        return Inertia::render('transaction/purchase/edit', [
            'purchase'  => $purchase,
            'suppliers' => $suppliers,
            'items'     => $items,
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
            $subtotal             = 0;
            $totalDiscount1Amount = 0;
            $totalDiscount2Amount = 0;
            $detailsData          = [];

            foreach ($request->details as $detail) {
                // Calculate per item
                $amount = $detail['quantity'] * $detail['price'];

                // Discount 1 per item
                $itemDiscount1Percent = $detail['discount1_percent'] ?? 0;
                $itemDiscount1Amount  = ($amount * $itemDiscount1Percent) / 100;
                $afterDiscount1       = $amount - $itemDiscount1Amount;

                // Discount 2 per item
                $itemDiscount2Percent = $detail['discount2_percent'] ?? 0;
                $itemDiscount2Amount  = ($afterDiscount1 * $itemDiscount2Percent) / 100;
                $itemSubtotal         = $afterDiscount1 - $itemDiscount2Amount;

                $subtotal             += $amount; // Sum all amounts before discount
                $totalDiscount1Amount += $itemDiscount1Amount;
                $totalDiscount2Amount += $itemDiscount2Amount;

                $detailsData[] = [
                    'item_id'           => $detail['item_id'],
                    'item_uom_id'       => $detail['item_uom_id'],
                    'quantity'          => $detail['quantity'],
                    'price'             => $detail['price'],
                    'discount1_percent' => $itemDiscount1Percent,
                    'discount1_amount'  => $itemDiscount1Amount,
                    'discount2_percent' => $itemDiscount2Percent,
                    'discount2_amount'  => $itemDiscount2Amount,
                    'subtotal'          => $itemSubtotal,
                ];
            }

            // Header discount calculated from sum of item discounts
            $discount1Amount  = $totalDiscount1Amount;
            $discount1Percent = $subtotal > 0 ? ($discount1Amount / $subtotal) * 100 : 0;

            $afterDiscount1   = $subtotal - $discount1Amount;
            $discount2Amount  = $totalDiscount2Amount;
            $discount2Percent = $afterDiscount1 > 0 ? ($discount2Amount / $afterDiscount1) * 100 : 0;

            $totalAfterDiscount = $afterDiscount1 - $discount2Amount;

            $ppnPercent = $request->ppn_percent ?? 0;
            $ppnAmount  = ($totalAfterDiscount * $ppnPercent) / 100;

            $totalAmount = $totalAfterDiscount + $ppnAmount;

            // Update purchase
            $purchase->update([
                'supplier_id'          => $request->supplier_id,
                'purchase_date'        => $request->purchase_date,
                'due_date'             => $request->due_date,
                'subtotal'             => $subtotal,
                'discount1_percent'    => $discount1Percent,
                'discount1_amount'     => $discount1Amount,
                'discount2_percent'    => $discount2Percent,
                'discount2_amount'     => $discount2Amount,
                'total_after_discount' => $totalAfterDiscount,
                'ppn_percent'          => $ppnPercent,
                'ppn_amount'           => $ppnAmount,
                'total_amount'         => $totalAmount,
                'notes'                => $request->notes,
                'updated_by'           => auth()->id(),
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
            $errorMessage = "Pembelian yang sudah dikonfirmasi tidak dapat dihapus.";
            return redirect()->back()->withErrors(['msg' => $errorMessage]);
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

    /**
     * Print purchase as PDF
     */
    public function raw(Purchase $purchase)
    {
        try {
            $purchase->load(['supplier.city', 'details.item', 'details.itemUom.uom']);

            $line = str_repeat("-", 80) . "\n";
            $raw = "            INVOICE PEMBELIAN\n";
            $raw .= $line;
            $raw .= str_pad("No. Faktur: " . $purchase->purchase_number, 40) . "Supplier  : " . ($purchase->supplier->name ?? '-') . "\n";
            $raw .= str_pad("Tanggal   : " . $purchase->purchase_date->format('d-m-Y'), 40) . "Kota      : " . ($purchase->supplier->city->name ?? '-') . "\n";
            $raw .= str_pad("Tempo     : " . ($purchase->due_date ? $purchase->due_date->format('d-m-Y') : '-'), 40) . "Telepon   : " . ($purchase->supplier->phone_number ?? '-') . "\n";
            $raw .= $line;
            $raw .= "No. Nama Barang                  Qty     Satuan      Harga           Subtotal\n";
            $raw .= $line;

            foreach ($purchase->details as $index => $detail) {
                $raw .= str_pad($index + 1, 3, ' ', STR_PAD_LEFT) . ". ";
                $raw .= str_pad(substr($detail->item->name, 0, 26), 27, ' ');
                $raw .= str_pad(number_format($detail->quantity, 0, ',', '.'), 7, ' ', STR_PAD_LEFT) . " ";
                $raw .= str_pad($detail->itemUom->uom->name ?? '-', 10, ' ');
                $raw .= str_pad(number_format($detail->price, 0, ',', '.'), 15, ' ', STR_PAD_LEFT);
                $raw .= str_pad(number_format($detail->subtotal, 0, ',', '.'), 15, ' ', STR_PAD_LEFT) . "\n";
            }

            // Fill up to 12 rows
            $rowCount = count($purchase->details);
            for ($i = $rowCount; $i < 12; $i++) {
                $raw .= str_pad($i + 1, 3, ' ', STR_PAD_LEFT) . ".\n";
            }

            $raw .= $line;
            $raw .= "Terbilang: " . \Riskihajar\Terbilang\Facades\Terbilang::make($purchase->total_amount) . " Rupiah\n";
            $raw .= str_pad("TOTAL: Rp. " . number_format($purchase->total_amount, 0, ',', '.'), 80, ' ', STR_PAD_LEFT) . "\n";
            $raw .= "\n\n";
            $raw .= str_pad("Tanda Terima", 26, ' ', STR_PAD_BOTH) . str_pad("Dikeluarkan", 26, ' ', STR_PAD_BOTH) . str_pad("Diperiksa", 26, ' ', STR_PAD_BOTH) . "\n\n\n";
            $raw .= str_pad("(          )", 26, ' ', STR_PAD_BOTH) . str_pad("(          )", 26, ' ', STR_PAD_BOTH) . str_pad("(          )", 26, ' ', STR_PAD_BOTH) . "\n";

            return response()->json(['raw' => $raw]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function print(Purchase $purchase)
    {
        try {
            $purchase->load(['supplier', 'details.item', 'details.itemUom.uom']);

            // 24.13cm x 13.97cm (9.5 x 5.5 inch) = 684pt x 396pt
            $pdf = Pdf::loadView('pdf.purchase', [
                'title'    => 'MB - ' . $purchase->purchase_number,
                'purchase' => $purchase,
            ])->setPaper([0, 0, 684, 396], 'portrait');

            $filename = 'purchase-' . $purchase->purchase_number . '.pdf';

            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Purchase - Exception caught', [
                'purchase_id' => $purchase->id,
                'error'       => $e->getMessage(),
                'file'        => $e->getFile(),
                'line'        => $e->getLine(),
            ]);

            return back()->withErrors([
                'message' => 'Error generating PDF: ' . $e->getMessage(),
            ]);
        }
    }
}
