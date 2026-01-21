<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchasePaymentRequest;
use App\Http\Requests\UpdatePurchasePaymentRequest;
use App\Models\Purchase;
use App\Models\PurchasePayment;
use App\Models\Bank;
use App\Models\CashOut;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class PurchasePaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(\Illuminate\Http\Request $request): Response
    {
        $query = PurchasePayment::with(['purchases.supplier', 'bank', 'items.purchase', 'creator', 'updater']);

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('payment_number', 'like', "%{$search}%")
                    ->orWhere('reference_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('bank', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('items.purchase.supplier', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('payment_date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('payment_date', '<=', $request->date_to);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by bank
        if ($request->has('bank_id') && $request->bank_id) {
            $query->where('bank_id', $request->bank_id);
        }

        // Filter by payment method
        if ($request->has('payment_method') && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }

        // Filter by supplier
        if ($request->has('supplier_id') && $request->supplier_id) {
            $query->whereHas('items.purchase', function ($q) use ($request) {
                $q->where('supplier_id', $request->supplier_id);
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = ['payment_date', 'payment_number', 'total_amount', 'status', 'id'];
        if (in_array($sortBy, $allowedSortFields)) {
            if ($sortBy === 'payment_number') {
                // Use natural sorting for payment numbers (PP1, PP2, PP3...)
                $query->orderByRaw("CAST(SUBSTRING(payment_number, 3) AS UNSIGNED) {$sortOrder}");
            } else {
                $query->orderBy($sortBy, $sortOrder);
            }
        } else {
            $query->orderBy('id', 'desc');
        }

        $payments = $query->paginate(10)->withQueryString();

        // Get banks and suppliers for filter
        $banks = Bank::orderBy('name')->get(['id', 'name']);
        $suppliers = \App\Models\Supplier::orderBy('name')->get(['id', 'name']);

        return Inertia::render('transaction/purchase-payment/index', [
            'purchase_payments' => $payments,
            'banks' => $banks,
            'suppliers' => $suppliers,
            'filters' => [
                'search' => $request->get('search', ''),
                'date_from' => $request->get('date_from', ''),
                'date_to' => $request->get('date_to', ''),
                'status' => $request->get('status', 'all'),
                'bank_id' => $request->get('bank_id', ''),
                'payment_method' => $request->get('payment_method', 'all'),
                'supplier_id' => $request->get('supplier_id', ''),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $banks = Bank::orderBy('name')->get();

        // Only load initial 10 purchases for display, rest will be loaded via search
        $purchases = Purchase::with('supplier')
            ->orderBy('purchase_date', 'desc')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get()
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($purchase) {
                // Only show purchases that are not fully paid
                return $purchase->remaining_amount > 0;
            })
            ->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'purchase_number' => $purchase->purchase_number,
                    'supplier' => $purchase->supplier,
                    'purchase_date' => $purchase->purchase_date,
                    'total_amount' => (float) $purchase->total_amount,
                    'total_paid' => (float) $purchase->total_paid,
                    'remaining_amount' => (float) $purchase->remaining_amount,
                ];
            })
            ->values();

        return Inertia::render('transaction/purchase-payment/create', [
            'purchases' => $purchases,
            'banks' => $banks,
        ]);
    }

    /**
     * Search purchases for async combobox (API endpoint)
     */
    public function searchPurchases(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $search = $request->get('search', '');
        $purchaseId = $request->get('id', '');
        $limit = $request->get('limit', 20);

        $query = Purchase::with('supplier');

        // If searching by ID, get that specific purchase
        if ($purchaseId) {
            $query->where('id', $purchaseId);
        } elseif ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('purchase_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
            
            // Should optimize search results: 
            // 1. Sort by length of purchase_number (shorter is likely closer to exact "MB1" vs "MB1000")
            // 2. Sort naturally by the number part
            $query->orderByRaw('LENGTH(purchase_number) ASC')
                  ->orderByRaw('CAST(SUBSTRING(purchase_number, 3) AS UNSIGNED) ASC');
        } else {
            // Default latest first
            $query->orderBy('purchase_date', 'desc')
                  ->orderBy('id', 'desc');
        }

        $purchases = $query->limit($limit)->get()
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($purchase) {
                // Only show purchases that are not fully paid
                return (float) $purchase->remaining_amount > 0;
            })
            ->map(function ($purchase) {
                return [
                    'value' => (string) $purchase->id,
                    'label' => "{$purchase->purchase_number} - " . ($purchase->supplier->name ?? 'No Supplier') . " (" . number_format((float) $purchase->total_amount, 0, ',', '.') . ")",
                    'displayLabel' => $purchase->purchase_number,
                    'purchase' => [
                        'id' => $purchase->id,
                        'purchase_number' => $purchase->purchase_number,
                        'supplier' => $purchase->supplier,
                        'purchase_date' => $purchase->purchase_date,
                        'total_amount' => (float) $purchase->total_amount,
                        'total_paid' => (float) $purchase->total_paid,
                        'remaining_amount' => (float) $purchase->remaining_amount,
                    ],
                ];
            })
            ->values();

        return response()->json([
            'data' => $purchases,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePurchasePaymentRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            // Create payment
            $payment = PurchasePayment::create([
                'payment_number' => PurchasePayment::generatePaymentNumber(),
                'payment_date' => $request->payment_date,
                'total_amount' => $request->total_amount, // Total paid to supplier from input
                'bank_id' => $request->bank_id,
                'payment_method' => $request->payment_method,
                'reference_number' => $request->reference_number,
                'transfer_fee' => $request->transfer_fee ?? 0,
                'notes' => $request->notes,
                'status' => $request->status ?? 'pending',
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Create payment items
            foreach ($request->items as $item) {
                $payment->items()->create([
                    'purchase_id' => $item['purchase_id'],
                    'amount' => $item['amount'],
                ]);
            }
        });

        return redirect()->route('purchase-payments.index')
            ->with('success', 'Pembayaran pembelian berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(PurchasePayment $purchasePayment): Response
    {
        $purchasePayment->load([
            'purchases.supplier', 
            'bank', 
            'items.purchase.supplier', 
            'creator', 
            'updater',
            'overpaymentTransactions.bank',
            'overpaymentTransactions.creator'
        ]);

        // Sort items by purchase number
        $purchasePayment->setRelation('items', $purchasePayment->items->sortBy('purchase.purchase_number', SORT_NATURAL)->values());

        // Get all banks for overpayment refund selection
        $banks = \App\Models\Bank::orderBy('name')
            ->get(['id', 'name', 'type']);

        return Inertia::render('transaction/purchase-payment/show', [
            'purchase_payment' => $purchasePayment,
            'banks' => $banks,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PurchasePayment $purchasePayment): Response
    {
        $purchasePayment->load(['purchases.supplier', 'items.purchase']);
        $banks = Bank::orderBy('name')->get();

        // Get IDs of purchases already in this payment
        $existingPurchaseIds = $purchasePayment->items->pluck('purchase_id')->toArray();

        // Load specific purchases already in this payment
        $existingPurchases = Purchase::with('supplier')
            ->whereIn('id', $existingPurchaseIds)
            ->get();

        // Load latest 10 unpaid purchases excluding the ones above
        $latestPurchases = Purchase::with('supplier')
            ->whereNotIn('id', $existingPurchaseIds)
            ->orderBy('purchase_date', 'desc')
            ->orderBy('id', 'desc')
            ->limit(20) // Fetch a few more to allow for filtering
            ->get();

        $purchases = $existingPurchases->merge($latestPurchases)
            ->unique('id')
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($purchase) use ($existingPurchaseIds) {
                // Show purchases that are either:
                // 1. Already in this payment (for editing), OR
                // 2. Not fully paid (remaining_amount > 0)
                return in_array($purchase->id, $existingPurchaseIds) || $purchase->remaining_amount > 0;
            })
            ->take(10 + count($existingPurchaseIds))
            ->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'purchase_number' => $purchase->purchase_number,
                    'supplier' => $purchase->supplier,
                    'purchase_date' => $purchase->purchase_date,
                    'total_amount' => (float) $purchase->total_amount,
                    'total_paid' => (float) $purchase->total_paid,
                    'remaining_amount' => (float) $purchase->remaining_amount,
                ];
            })
            ->values();

        return Inertia::render('transaction/purchase-payment/edit', [
            'purchase_payment' => $purchasePayment,
            'banks' => $banks,
            'purchases' => $purchases,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePurchasePaymentRequest $request, PurchasePayment $purchasePayment): RedirectResponse
    {
        // Only allow update if status is pending
        if ($purchasePayment->status === 'confirmed') {
            return redirect()->route('purchase-payments.show', $purchasePayment)
                ->with('error', 'Pembayaran yang sudah dikonfirmasi tidak dapat diedit.');
        }

        // Update payment
        $purchasePayment->update([
            'payment_date' => $request->payment_date,
            'total_amount' => $request->total_amount, // Total paid to supplier from input
            'bank_id' => $request->bank_id,
            'payment_method' => $request->payment_method,
            'reference_number' => $request->reference_number,
            'transfer_fee' => $request->transfer_fee ?? 0,
            'notes' => $request->notes,
            'updated_by' => auth()->id(),
        ]);

        // Delete old items and create new ones
        $purchasePayment->items()->delete();
        foreach ($request->items as $item) {
            $purchasePayment->items()->create([
                'purchase_id' => $item['purchase_id'],
                'amount' => $item['amount'],
            ]);
        }

        return redirect()->route('purchase-payments.index', $purchasePayment)
            ->with('success', 'Pembayaran pembelian berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PurchasePayment $purchasePayment): RedirectResponse
    {
        // Only allow delete if status is pending
        if ($purchasePayment->status === 'confirmed') {
            return redirect()->route('purchase-payments.index')
                ->with('error', 'Pembayaran yang sudah dikonfirmasi tidak dapat dihapus.');
        }

        $purchasePayment->delete();

        return redirect()->route('purchase-payments.index')
            ->with('success', 'Pembayaran pembelian berhasil dihapus.');
    }

    /**
     * Confirm payment
     */
    public function confirm(PurchasePayment $purchasePayment): RedirectResponse
    {
        if ($purchasePayment->status === 'confirmed') {
            return redirect()->route('purchase-payments.show', $purchasePayment)
                ->with('error', 'Pembayaran sudah dikonfirmasi.');
        }

        DB::transaction(function () use ($purchasePayment) {
            // Calculate overpayment before confirming
            $overpaymentAmount = $purchasePayment->calculateOverpayment();
            
            $purchasePayment->update([
                'status' => 'confirmed',
                'overpayment_amount' => $overpaymentAmount,
                'overpayment_status' => $overpaymentAmount > 0 ? 'pending' : 'none',
                'updated_by' => auth()->id(),
            ]);

            // Create cash out record if bank is selected
            // This will post: Debit Hutang Usaha, Credit Bank
            if ($purchasePayment->bank_id) {
                // Get payable account (2101 - Hutang Usaha) for payment
                $payableAccount = ChartOfAccount::where('code', '2101')
                    ->where('is_active', true)
                    ->first();

                if (!$payableAccount) {
                    $payableAccount = ChartOfAccount::whereIn('type', ['liability', 'hutang'])
                        ->where('is_active', true)
                        ->orderBy('code')
                        ->first();
                }

                if ($payableAccount) {
                    // Create primary payment CashOut
                    $this->createCashOut(
                        $purchasePayment,
                        $payableAccount->id,
                        $purchasePayment->total_amount,
                        "Pembayaran Pembelian #{$purchasePayment->payment_number}"
                    );

                    // Create transfer fee CashOut if exists
                    if ($purchasePayment->transfer_fee > 0) {
                        $feeAccount = ChartOfAccount::where('code', '6109')
                            ->where('is_active', true)
                            ->first();

                        if (!$feeAccount) {
                            $feeAccount = ChartOfAccount::where('name', 'like', '%Administrasi Bank%')
                                ->where('is_active', true)
                                ->first();
                        }

                        if ($feeAccount) {
                            $this->createCashOut(
                                $purchasePayment,
                                $feeAccount->id,
                                $purchasePayment->transfer_fee,
                                "Biaya Transfer Pembayaran Pembelian #{$purchasePayment->payment_number}"
                            );
                        }
                    }

                    // If there's overpayment, adjust the journal entry
                    // We need to reclassify overpayment from Hutang to Uang Muka Pembelian
                    if ($overpaymentAmount > 0) {
                        $this->recordOverpaymentAsset($purchasePayment, $overpaymentAmount);
                    }
                } else {
                    // If no payable account found, still create cash movement for total (payment + fee)
                    $bank = \App\Models\Bank::lockForUpdate()->find($purchasePayment->bank_id);
                    if ($bank) {
                        $totalOut = (float) $purchasePayment->total_amount + (float) $purchasePayment->transfer_fee;
                        app(\App\Services\CashMovementService::class)->createMovement(
                            $bank,
                            'PurchasePayment',
                            $purchasePayment->id,
                            $purchasePayment->payment_date,
                            0,
                            $totalOut,
                            "Pembayaran Pembelian #{$purchasePayment->payment_number} (Inc Fee)"
                        );
                    }
                }
            }
        });

        return redirect()->route('purchase-payments.show', $purchasePayment)
            ->with('success', 'Pembayaran berhasil dikonfirmasi.');
    }

    /**
     * Unconfirm payment
     */
    public function unconfirm(PurchasePayment $purchasePayment): RedirectResponse
    {
        if ($purchasePayment->status === 'pending') {
            return redirect()->route('purchase-payments.show', $purchasePayment)
                ->with('error', 'Pembayaran belum dikonfirmasi.');
        }

        DB::transaction(function () use ($purchasePayment) {
            // Find and reverse cash outs if exists
            $cashOuts = CashOut::where('reference_type', 'PurchasePayment')
                ->where('reference_id', $purchasePayment->id)
                ->where('status', 'posted')
                ->get();

            if ($cashOuts->count() > 0) {
                foreach ($cashOuts as $cashOut) {
                    // Reverse cash out (this will also update bank balance)
                    app(\App\Services\JournalService::class)->reverseCashOut($cashOut);
                    $cashOut->delete(); // Soft delete
                }
            } else {
                // If no cash out found, delete cash movement manually
                if ($purchasePayment->bank_id) {
                    $cashMovements = \App\Models\CashMovement::where('reference_type', 'PurchasePayment')
                        ->where('reference_id', $purchasePayment->id)
                        ->get();

                    foreach ($cashMovements as $cashMovement) {
                        app(\App\Services\CashMovementService::class)->deleteMovement($cashMovement);
                    }
                }
            }

            // Reverse overpayment asset journal entry if exists
            if ($purchasePayment->overpayment_amount > 0) {
                $overpaymentJournal = JournalEntry::where('reference_type', 'PurchasePayment')
                    ->where('reference_id', $purchasePayment->id)
                    ->where('description', 'like', 'Kelebihan Pembayaran%')
                    ->where('status', 'posted')
                    ->first();

                if ($overpaymentJournal) {
                    // Mark as reversed
                    $overpaymentJournal->update(['status' => 'reversed']);
                }
            }

            $purchasePayment->update([
                'status' => 'pending',
                'overpayment_amount' => 0,
                'overpayment_status' => 'none',
                'updated_by' => auth()->id(),
            ]);
        });

        return redirect()->route('purchase-payments.show', $purchasePayment)
            ->with('success', 'Konfirmasi pembayaran dibatalkan.');
    }

    /**
     * Record overpayment as asset (Uang Muka Pembelian)
     */
    private function recordOverpaymentAsset(PurchasePayment $purchasePayment, float $overpaymentAmount): void
    {
        // Get "Uang Muka Pembelian" account (1401)
        $advanceAccount = ChartOfAccount::where('code', '1401')
            ->where('is_active', true)
            ->first();

        if (!$advanceAccount) {
            // Try to find any other asset/advance account
            $advanceAccount = ChartOfAccount::where('type', 'asset')
                ->where('is_active', true)
                ->where('code', 'like', '14%')
                ->orderBy('code')
                ->first();
        }

        if (!$advanceAccount) {
            \Log::warning("Overpayment detected but no 'Uang Muka Pembelian' account found for PurchasePayment #{$purchasePayment->payment_number}");
            return;
        }

        // Get payable account to reverse the overpayment portion
        $payableAccount = ChartOfAccount::where('code', '2101')
            ->where('is_active', true)
            ->first();

        if (!$payableAccount) {
            $payableAccount = ChartOfAccount::whereIn('type', ['liability', 'hutang'])
                ->where('is_active', true)
                ->orderBy('code')
                ->first();
        }

        if (!$payableAccount) {
            \Log::warning("Payable account not found for overpayment adjustment");
            return;
        }

        // Create journal entry for overpayment
        // The CashOut already posted: Dr. Hutang Usaha (full amount), Cr. Bank (full amount)
        // We need to adjust for the overpayment portion:
        // Dr. Uang Muka Pembelian (overpayment), Cr. Hutang Usaha (overpayment - to reverse the excess debit)
        
        $journalEntry = JournalEntry::create([
            'journal_number' => JournalEntry::generateJournalNumber(),
            'journal_date' => $purchasePayment->payment_date,
            'description' => "Kelebihan Pembayaran ke Supplier #{$purchasePayment->payment_number}",
            'reference_type' => 'PurchasePayment',
            'reference_id' => $purchasePayment->id,
            'status' => 'posted',
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);

        // Debit: Uang Muka Pembelian
        JournalEntryDetail::create([
            'journal_entry_id' => $journalEntry->id,
            'chart_of_account_id' => $advanceAccount->id,
            'debit' => $overpaymentAmount,
            'credit' => 0,
            'description' => "Uang muka dari kelebihan pembayaran",
        ]);

        // Credit: Hutang Usaha (to reverse overpayment portion)
        JournalEntryDetail::create([
            'journal_entry_id' => $journalEntry->id,
            'chart_of_account_id' => $payableAccount->id,
            'debit' => 0,
            'credit' => $overpaymentAmount,
            'description' => "Penyesuaian kelebihan pembayaran ke supplier",
        ]);
    }
    /**
     * Helper to create CashOut and post to journal
     */
    private function createCashOut(PurchasePayment $purchasePayment, int $accountId, float $amount, string $description): void
    {
        // Generate cash out number with retry logic to handle race conditions
        $maxRetries = 5;
        $cashOut = null;

        for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
            try {
                $cashOutNumber = CashOut::generateCashOutNumber();

                $cashOut = CashOut::create([
                    'cash_out_number' => $cashOutNumber,
                    'cash_out_date' => $purchasePayment->payment_date,
                    'bank_id' => $purchasePayment->bank_id,
                    'chart_of_account_id' => $accountId,
                    'amount' => $amount,
                    'description' => $description,
                    'status' => 'posted',
                    'reference_type' => 'PurchasePayment',
                    'reference_id' => $purchasePayment->id,
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
                ]);

                break;
            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->getCode() == 23000 && (str_contains($e->getMessage(), 'cash_out_number') || str_contains($e->getMessage(), 'cash_outs_cash_out_number_unique'))) {
                    if ($attempt === $maxRetries - 1) {
                        throw $e;
                    }
                    usleep(10000 * ($attempt + 1));
                    continue;
                }
                throw $e;
            }
        }

        app(\App\Services\JournalService::class)->postCashOut($cashOut);
    }
}
