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
        $this->authorize('viewAny', Purchase::class);

        $query = Purchase::with(['supplier.city', 'details.item', 'details.itemUom', 'creator', 'updater']);

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

        // Supplier filter (for history button from supplier master)
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        // Date range
        if ($request->filled('date_from')) {
            $query->whereDate('purchase_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('purchase_date', '<=', $request->date_to);
        }

        // Payment status filter (must be BEFORE pagination)
        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            if ($request->payment_status === 'paid') {
                // Lunas: total_paid >= total_amount
                $query->whereRaw('(
                    SELECT COALESCE(SUM(ppi.amount), 0)
                    FROM purchase_payment_items ppi
                    JOIN purchase_payments pp ON pp.id = ppi.purchase_payment_id
                    WHERE ppi.purchase_id = purchases.id
                    AND pp.status = "confirmed"
                    AND pp.deleted_at IS NULL
                ) >= purchases.total_amount');
            } else {
                // Belum lunas: total_paid < total_amount
                $query->whereRaw('(
                    SELECT COALESCE(SUM(ppi.amount), 0)
                    FROM purchase_payment_items ppi
                    JOIN purchase_payments pp ON pp.id = ppi.purchase_payment_id
                    WHERE ppi.purchase_id = purchases.id
                    AND pp.status = "confirmed"
                    AND pp.deleted_at IS NULL
                ) < purchases.total_amount');
            }
        }

        // Sort
        $sortBy    = $request->get('sort_by', 'purchase_number');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = ['purchase_date', 'purchase_number', 'total_amount', 'status'];

        if ($sortBy === 'purchase_number') {
            $query->orderByRaw('CAST(SUBSTRING(purchase_number, 3) AS UNSIGNED) ' . $sortOrder);
        } else {
            $query->orderBy(in_array($sortBy, $allowedSortFields) ? $sortBy : 'purchase_number', $sortOrder);
        }

        // Secondary sort always by purchase number desc
        $query->orderByRaw('CAST(SUBSTRING(purchase_number, 3) AS UNSIGNED) DESC');

        // Default per-page 10
        $perPage = $request->get('per_page', 10);

        // Query now paginated
        $purchases = $query->paginate($perPage)->withQueryString();

        // Append computed attributes (only for current page)
        $purchases->getCollection()->each->append(['total_paid', 'remaining_amount']);

        // Add permissions
        $purchases->getCollection()->transform(function ($purchase) {
            $purchase->can = [
                'edit'   => auth()->user() ? auth()->user()->can('update', $purchase) : false,
                'delete' => auth()->user() ? auth()->user()->can('delete', $purchase) : false,
            ];

            return $purchase;
        });

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
        $this->authorize('create', Purchase::class);

        $suppliers = Supplier::with('city')->orderBy('name')->get();
        $items     = Item::with('itemUoms.uom')->orderBy('name')->limit(20)->get();

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
        $this->authorize('create', Purchase::class);

        DB::transaction(function () use ($request) {
            // Calculate totals dari semua items
            $subtotal             = 0;
            $totalDiscount1Amount = 0;
            $totalDiscount2Amount = 0;
            $totalDiscount3Amount = 0;
            $totalDiscount4Amount = 0;
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
                $afterDiscount2       = $afterDiscount1 - $itemDiscount2Amount;

                // Discount 3 per item
                $itemDiscount3Percent = $detail['discount3_percent'] ?? 0;
                $itemDiscount3Amount  = ($afterDiscount2 * $itemDiscount3Percent) / 100;
                $afterDiscount3       = $afterDiscount2 - $itemDiscount3Amount;

                // Discount 4 per item
                $itemDiscount4Percent = $detail['discount4_percent'] ?? 0;
                $itemDiscount4Amount  = ($afterDiscount3 * $itemDiscount4Percent) / 100;
                $itemSubtotal         = $afterDiscount3 - $itemDiscount4Amount;

                $subtotal             += $amount; // Sum all amounts before discount
                $totalDiscount1Amount += $itemDiscount1Amount;
                $totalDiscount2Amount += $itemDiscount2Amount;
                $totalDiscount3Amount += $itemDiscount3Amount;
                $totalDiscount4Amount += $itemDiscount4Amount;

                $detailsData[] = [
                    'item_id'           => $detail['item_id'],
                    'item_uom_id'       => $detail['item_uom_id'],
                    'quantity'          => $detail['quantity'],
                    'price'             => $detail['price'],
                    'discount1_percent' => $itemDiscount1Percent,
                    'discount1_amount'  => $itemDiscount1Amount,
                    'discount2_percent' => $itemDiscount2Percent,
                    'discount2_amount'  => $itemDiscount2Amount,
                    'discount3_percent' => $itemDiscount3Percent,
                    'discount3_amount'  => $itemDiscount3Amount,
                    'discount4_percent' => $itemDiscount4Percent,
                    'discount4_amount'  => $itemDiscount4Amount,
                    'subtotal'          => $itemSubtotal,
                ];
            }

            if (empty($detailsData)) {
                throw new \Exception('Tidak ada detail item yang diproses. Silakan input ulang barang.');
            }

            // Header discount calculated from sum of item discounts
            $discount1Amount  = $totalDiscount1Amount;
            $discount1Percent = $subtotal > 0 ? ($discount1Amount / $subtotal) * 100 : 0;

            // Calculate discount 2 (applied after discount 1)
            $afterDiscount1   = $subtotal - $discount1Amount;
            $discount2Amount  = $totalDiscount2Amount;
            $discount2Percent = $afterDiscount1 > 0 ? ($discount2Amount / $afterDiscount1) * 100 : 0;

            $afterDiscount2   = $afterDiscount1 - $discount2Amount;
            $discount3Amount  = $totalDiscount3Amount;
            $discount3Percent = $afterDiscount2 > 0 ? ($discount3Amount / $afterDiscount2) * 100 : 0;

            $afterDiscount3   = $afterDiscount2 - $discount3Amount;
            $discount4Amount  = $totalDiscount4Amount;
            $discount4Percent = $afterDiscount3 > 0 ? ($discount4Amount / $afterDiscount3) * 100 : 0;

            $totalAfterDiscount = $afterDiscount3 - $discount4Amount;

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
                        'discount3_percent'    => $discount3Percent,
                        'discount3_amount'     => $discount3Amount,
                        'discount4_percent'    => $discount4Percent,
                        'discount4_amount'     => $discount4Amount,
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
        $this->authorize('view', $purchase);

        $purchase->load(['supplier.city', 'details.item', 'details.itemUom.uom', 'creator', 'updater']);

        // Append computed attributes for payment tracking
        $purchase->append(['total_paid', 'remaining_amount']);

        $purchase->can = [
            'edit'   => auth()->user() ? auth()->user()->can('update', $purchase) : false,
            'delete' => auth()->user() ? auth()->user()->can('delete', $purchase) : false,
        ];

        return Inertia::render('transaction/purchase/show', [
            'purchase' => $purchase,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Purchase $purchase): Response|RedirectResponse
    {
        $this->authorize('update', $purchase);

        if ($purchase->status === 'confirmed') {
            return redirect()
                ->route('purchases.show', $purchase)
                ->with('error', 'Pembelian yang sudah dikonfirmasi tidak dapat diedit.');
        }

        $purchase->load(['supplier.city', 'details.item.itemUoms.uom', 'details.itemUom.uom']);
        $suppliers = Supplier::with('city')->orderBy('name')->limit(10)->get();
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
        $this->authorize('update', $purchase);

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
            $totalDiscount3Amount = 0;
            $totalDiscount4Amount = 0;
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
                $afterDiscount2       = $afterDiscount1 - $itemDiscount2Amount;

                // Discount 3 per item
                $itemDiscount3Percent = $detail['discount3_percent'] ?? 0;
                $itemDiscount3Amount  = ($afterDiscount2 * $itemDiscount3Percent) / 100;
                $afterDiscount3       = $afterDiscount2 - $itemDiscount3Amount;

                // Discount 4 per item
                $itemDiscount4Percent = $detail['discount4_percent'] ?? 0;
                $itemDiscount4Amount  = ($afterDiscount3 * $itemDiscount4Percent) / 100;
                $itemSubtotal         = $afterDiscount3 - $itemDiscount4Amount;

                $subtotal             += $amount; // Sum all amounts before discount
                $totalDiscount1Amount += $itemDiscount1Amount;
                $totalDiscount2Amount += $itemDiscount2Amount;
                $totalDiscount3Amount += $itemDiscount3Amount;
                $totalDiscount4Amount += $itemDiscount4Amount;

                $detailsData[] = [
                    'item_id'           => $detail['item_id'],
                    'item_uom_id'       => $detail['item_uom_id'],
                    'quantity'          => $detail['quantity'],
                    'price'             => $detail['price'],
                    'discount1_percent' => $itemDiscount1Percent,
                    'discount1_amount'  => $itemDiscount1Amount,
                    'discount2_percent' => $itemDiscount2Percent,
                    'discount2_amount'  => $itemDiscount2Amount,
                    'discount3_percent' => $itemDiscount3Percent,
                    'discount3_amount'  => $itemDiscount3Amount,
                    'discount4_percent' => $itemDiscount4Percent,
                    'discount4_amount'  => $itemDiscount4Amount,
                    'subtotal'          => $itemSubtotal,
                ];
            }

            if (empty($detailsData)) {
                throw new \Exception('Tidak ada detail item yang diproses. Silakan input ulang barang.');
            }

            // Header discount calculated from sum of item discounts
            $discount1Amount  = $totalDiscount1Amount;
            $discount1Percent = $subtotal > 0 ? ($discount1Amount / $subtotal) * 100 : 0;

            $afterDiscount1   = $subtotal - $discount1Amount;
            $discount2Amount  = $totalDiscount2Amount;
            $discount2Percent = $afterDiscount1 > 0 ? ($discount2Amount / $afterDiscount1) * 100 : 0;

            $afterDiscount2   = $afterDiscount1 - $discount2Amount;
            $discount3Amount  = $totalDiscount3Amount;
            $discount3Percent = $afterDiscount2 > 0 ? ($discount3Amount / $afterDiscount2) * 100 : 0;

            $afterDiscount3   = $afterDiscount2 - $discount3Amount;
            $discount4Amount  = $totalDiscount4Amount;
            $discount4Percent = $afterDiscount3 > 0 ? ($discount4Amount / $afterDiscount3) * 100 : 0;

            $totalAfterDiscount = $afterDiscount3 - $discount4Amount;

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
                'discount3_percent'    => $discount3Percent,
                'discount3_amount'     => $discount3Amount,
                'discount4_percent'    => $discount4Percent,
                'discount4_amount'     => $discount4Amount,
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
        $this->authorize('delete', $purchase);

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
        $this->authorize('update', $purchase);

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
        $this->authorize('update', $purchase);

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
    public function print(Purchase $purchase)
    {
        $this->authorize('view', $purchase);

        try {
            $purchase->load(['supplier', 'details.item', 'details.itemUom.uom']);

            // 9.5 x 11 inches = 241 x 279 mm = 684 x 792 points
            $pdf = Pdf::loadView('pdf.purchase', [
                'title'    => 'MB - ' . $purchase->purchase_number,
                'purchase' => $purchase,
            ])->setPaper([0, 0, 684, 792], 'portrait'); // 9.5 x 11 inches

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

    /**
     * Write off small remaining amount (< 1000) as rounding difference
     */
    public function writeOff(Purchase $purchase): RedirectResponse
    {
        $this->authorize('update', $purchase);

        // Load remaining amount
        $purchase->append(['total_paid', 'remaining_amount']);

        // Validate remaining amount
        if ($purchase->remaining_amount <= 0) {
            return redirect()->route('purchases.show', $purchase)
                ->with('error', 'Pembelian sudah lunas.');
        }

        if ($purchase->remaining_amount >= 1000) {
            return redirect()->route('purchases.show', $purchase)
                ->with('error', 'Write-off hanya untuk selisih kecil (< Rp 1.000). Sisa: Rp ' . number_format($purchase->remaining_amount, 0, ',', '.'));
        }

        // Get write-off account (6999 - Selisih Pembulatan Pembelian)
        $writeOffAccount = \App\Models\ChartOfAccount::where('code', '6999')
            ->where('is_active', true)
            ->first();

        if (!$writeOffAccount) {
            return redirect()->route('purchases.show', $purchase)
                ->with('error', 'Akun Selisih Pembulatan (6999) tidak ditemukan. Silakan hubungi administrator.');
        }

        // Get Hutang Usaha account (2101)
        $hutangAccount = \App\Models\ChartOfAccount::where('code', '2101')
            ->where('is_active', true)
            ->first();

        if (!$hutangAccount) {
            return redirect()->route('purchases.show', $purchase)
                ->with('error', 'Akun Hutang Usaha (2101) tidak ditemukan. Silakan hubungi administrator.');
        }

        DB::transaction(function () use ($purchase, $writeOffAccount, $hutangAccount) {
            // Store remaining amount before creating payment (it will become 0 after payment)
            $writeOffAmount = $purchase->remaining_amount;

            // Create purchase payment for remaining amount
            $payment = \App\Models\PurchasePayment::create([
                'payment_number' => \App\Models\PurchasePayment::generatePaymentNumber(),
                'payment_date' => now(),
                'total_amount' => $writeOffAmount,
                'bank_id' => null, // No bank involved in write-off
                'payment_method' => 'other',
                'reference_number' => null,
                'notes' => 'Write-off selisih pembulatan',
                'status' => 'confirmed', // Auto-confirm
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Create payment item
            $payment->items()->create([
                'purchase_id' => $purchase->id,
                'amount' => $writeOffAmount,
            ]);

            // Post journal entry directly (skip CashOut since no cash movement)
            $journalEntry = \App\Models\JournalEntry::create([
                'journal_number' => \App\Models\JournalEntry::generateJournalNumber(),
                'journal_date' => now(),
                'reference_type' => 'PurchasePayment',
                'reference_id' => $payment->id,
                'description' => "Write-off Pembelian #{$purchase->purchase_number}",
                'status' => 'posted',
            ]);

            // Journal entry details
            // Debit: Hutang Usaha (reduce liability)
            \App\Models\JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $hutangAccount->id,
                'debit' => $writeOffAmount,
                'credit' => 0,
                'description' => "Write-off Hutang #{$purchase->purchase_number}",
            ]);

            // Credit: Selisih Pembulatan (expense)
            \App\Models\JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $writeOffAccount->id,
                'debit' => 0,
                'credit' => $writeOffAmount,
                'description' => 'Selisih pembulatan pembelian',
            ]);
        });

        return redirect()->route('purchases.show', $purchase)
            ->with('success', 'Selisih pembulatan berhasil di-write-off. Pembelian sekarang lunas.');
    }
}
