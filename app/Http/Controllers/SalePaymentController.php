<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSalePaymentRequest;
use App\Http\Requests\UpdateSalePaymentRequest;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\Bank;
use App\Models\CashIn;
use App\Models\ChartOfAccount;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class SalePaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(\Illuminate\Http\Request $request): Response
    {
        $query = SalePayment::with(['sales.customer', 'bank', 'items.sale', 'creator', 'updater']);

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
                    ->orWhereHas('items.sale.customer', function ($q) use ($search) {
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

        // Filter by customer
        if ($request->has('customer_id') && $request->customer_id) {
            $query->whereHas('items.sale', function ($q) use ($request) {
                $q->where('customer_id', $request->customer_id);
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'payment_date');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = ['payment_date', 'payment_number', 'total_amount', 'status'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('payment_date', 'desc');
        }
        $query->orderBy('id', 'desc');

        $payments = $query->paginate(10)->withQueryString();

        // Get banks and customers for filter
        $banks = Bank::orderBy('name')->get(['id', 'name']);
        $customers = \App\Models\Customer::orderBy('name')->get(['id', 'name']);

        return Inertia::render('transaction/sale-payment/index', [
            'sale_payments' => $payments,
            'banks' => $banks,
            'customers' => $customers,
            'filters' => [
                'search' => $request->get('search', ''),
                'date_from' => $request->get('date_from', ''),
                'date_to' => $request->get('date_to', ''),
                'status' => $request->get('status', 'all'),
                'bank_id' => $request->get('bank_id', ''),
                'payment_method' => $request->get('payment_method', 'all'),
                'customer_id' => $request->get('customer_id', ''),
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

        // Only load initial 10 sales for display, rest will be loaded via search
        $sales = Sale::with('customer')
            ->orderBy('sale_date', 'desc')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get()
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($sale) {
                // Only show sales that are not fully paid
                return $sale->remaining_amount > 0;
            })
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'customer' => $sale->customer,
                    'sale_date' => $sale->sale_date,
                    'total_amount' => (float) $sale->total_amount,
                    'total_paid' => (float) $sale->total_paid,
                    'remaining_amount' => (float) $sale->remaining_amount,
                ];
            })
            ->values();

        return Inertia::render('transaction/sale-payment/create', [
            'sales' => $sales,
            'banks' => $banks,
        ]);
    }

    /**
     * Search sales for async combobox (API endpoint)
     */
    public function searchSales(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $search = $request->get('search', '');
        $saleId = $request->get('id', '');
        $limit = $request->get('limit', 20);

        $query = Sale::with('customer');
            
        // If searching by ID, get that specific sale
        if ($saleId) {
            $query->where('id', $saleId);
        } elseif ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('sale_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });

            // Optimize search results for exact/short matches like "MJ1"
            $query->orderByRaw('LENGTH(sale_number) ASC')
                  ->orderByRaw('CAST(SUBSTRING(sale_number, 3) AS UNSIGNED) ASC');
        } else {
            // Default latest first
            $query->orderBy('sale_date', 'desc')
                  ->orderBy('id', 'desc');
        }

        $sales = $query->limit($limit)->get()
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($sale) {
                // Only show sales that are not fully paid
                return (float) $sale->remaining_amount > 0;
            })
            ->map(function ($sale) {
                return [
                    'value' => (string) $sale->id,
                    'label' => "{$sale->sale_number} - " . ($sale->customer->name ?? 'No Customer') . " (" . number_format((float) $sale->total_amount, 0, ',', '.') . ")",
                    'displayLabel' => $sale->sale_number,
                    'sale' => [
                        'id' => $sale->id,
                        'sale_number' => $sale->sale_number,
                        'customer' => $sale->customer,
                        'sale_date' => $sale->sale_date,
                        'total_amount' => (float) $sale->total_amount,
                        'total_paid' => (float) $sale->total_paid,
                        'remaining_amount' => (float) $sale->remaining_amount,
                    ],
                ];
            })
            ->values();

        return response()->json([
            'data' => $sales,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSalePaymentRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            // Calculate total amount from items
            $totalAmount = collect($request->items)->sum('amount');

            // Create payment
            $payment = SalePayment::create([
                'payment_number' => SalePayment::generatePaymentNumber(),
                'payment_date' => $request->payment_date,
                'total_amount' => $totalAmount,
                'bank_id' => $request->bank_id,
                'payment_method' => $request->payment_method,
                'reference_number' => $request->reference_number,
                'notes' => $request->notes,
                'status' => $request->status ?? 'pending',
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Create payment items
            foreach ($request->items as $item) {
                $payment->items()->create([
                    'sale_id' => $item['sale_id'],
                    'amount' => $item['amount'],
                ]);
            }
        });

        return redirect()->route('sale-payments.index')
            ->with('success', 'Pembayaran penjualan berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(SalePayment $salePayment): Response
    {
        $salePayment->load([
            'sales.customer', 
            'bank', 
            'items.sale.customer', 
            'creator', 
            'updater',
            'overpaymentTransactions.bank',
            'overpaymentTransactions.creator'
        ]);

        // Sort items by sale number
        $salePayment->setRelation('items', $salePayment->items->sortBy('sale.sale_number', SORT_NATURAL)->values());

        // Get all active banks for overpayment refund selection
        $banks = \App\Models\Bank::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'type']);

        return Inertia::render('transaction/sale-payment/show', [
            'sale_payment' => $salePayment,
            'banks' => $banks,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SalePayment $salePayment): Response
    {
        $salePayment->load(['sales.customer', 'items.sale']);
        $banks = Bank::orderBy('name')->get();

        // Get IDs of sales already in this payment
        $existingSaleIds = $salePayment->items->pluck('sale_id')->toArray();

        // Load specific sales already in this payment
        $existingSales = Sale::with('customer')
            ->whereIn('id', $existingSaleIds)
            ->get();

        // Load latest 10 unpaid sales excluding the ones above
        $latestSales = Sale::with('customer')
            ->whereNotIn('id', $existingSaleIds)
            ->orderBy('sale_date', 'desc')
            ->orderBy('id', 'desc')
            ->limit(20)
            ->get();

        $sales = $existingSales->merge($latestSales)
            ->unique('id')
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($sale) use ($existingSaleIds) {
                // Show sales that are either:
                // 1. Already in this payment (for editing), OR
                // 2. Not fully paid (remaining_amount > 0)
                return in_array($sale->id, $existingSaleIds) || $sale->remaining_amount > 0;
            })
            ->take(10 + count($existingSaleIds))
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'customer' => $sale->customer,
                    'sale_date' => $sale->sale_date,
                    'total_amount' => (float) $sale->total_amount,
                    'total_paid' => (float) $sale->total_paid,
                    'remaining_amount' => (float) $sale->remaining_amount,
                ];
            })
            ->values();

        return Inertia::render('transaction/sale-payment/edit', [
            'sale_payment' => $salePayment,
            'banks' => $banks,
            'sales' => $sales,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSalePaymentRequest $request, SalePayment $salePayment): RedirectResponse
    {
        // Only allow update if status is pending
        if ($salePayment->status === 'confirmed') {
            return redirect()->route('sale-payments.show', $salePayment)
                ->with('error', 'Pembayaran yang sudah dikonfirmasi tidak dapat diedit.');
        }

        // Calculate total amount from items
        $totalAmount = collect($request->items)->sum('amount');

        // Update payment
        $salePayment->update([
            'payment_date' => $request->payment_date,
            'total_amount' => $totalAmount,
            'bank_id' => $request->bank_id,
            'payment_method' => $request->payment_method,
            'reference_number' => $request->reference_number,
            'notes' => $request->notes,
            'updated_by' => auth()->id(),
        ]);

        // Delete old items and create new ones
        $salePayment->items()->delete();
        foreach ($request->items as $item) {
            $salePayment->items()->create([
                'sale_id' => $item['sale_id'],
                'amount' => $item['amount'],
            ]);
        }

        return redirect()->route('sale-payments.show', $salePayment)
            ->with('success', 'Pembayaran penjualan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SalePayment $salePayment): RedirectResponse
    {
        // Only allow delete if status is pending
        if ($salePayment->status === 'confirmed') {
            return redirect()->route('sale-payments.index')
                ->with('error', 'Pembayaran yang sudah dikonfirmasi tidak dapat dihapus.');
        }

        $salePayment->delete();

        return redirect()->route('sale-payments.index')
            ->with('success', 'Pembayaran penjualan berhasil dihapus.');
    }

    /**
     * Confirm payment
     */
    public function confirm(SalePayment $salePayment): RedirectResponse
    {
        if ($salePayment->status === 'confirmed') {
            return redirect()->route('sale-payments.show', $salePayment)
                ->with('error', 'Pembayaran sudah dikonfirmasi.');
        }

        DB::transaction(function () use ($salePayment) {
            // Calculate overpayment before confirming
            $overpaymentAmount = $salePayment->calculateOverpayment();
            
            $salePayment->update([
                'status' => 'confirmed',
                'overpayment_amount' => $overpaymentAmount,
                'overpayment_status' => $overpaymentAmount > 0 ? 'pending' : 'none',
                'updated_by' => auth()->id(),
            ]);

            // Create cash in record if bank is selected
            if ($salePayment->bank_id) {
                // Get receivable account (1201 - Piutang Usaha) for payment
                $receivableAccount = ChartOfAccount::where('code', '1201')
                    ->where('is_active', true)
                    ->first();

                if (!$receivableAccount) {
                    $receivableAccount = ChartOfAccount::whereIn('type', ['asset', 'piutang'])
                        ->where('is_active', true)
                        ->orderBy('code')
                        ->first();
                }

                if ($receivableAccount) {
                    // Generate cash in number with retry logic to handle race conditions
                    $maxRetries = 5;
                    $cashIn = null;

                    for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
                        try {
                            $cashInNumber = CashIn::generateCashInNumber();

                            // CashIn records the full payment amount to bank
                            $cashIn = CashIn::create([
                                'cash_in_number' => $cashInNumber,
                                'cash_in_date' => $salePayment->payment_date,
                                'bank_id' => $salePayment->bank_id,
                                'chart_of_account_id' => $receivableAccount->id,
                                'amount' => $salePayment->total_amount, // Full amount including overpayment
                                'description' => "Pembayaran Penjualan #{$salePayment->payment_number}",
                                'status' => 'posted',
                                'reference_type' => 'SalePayment',
                                'reference_id' => $salePayment->id,
                                'created_by' => auth()->id(),
                                'updated_by' => auth()->id(),
                            ]);

                            break; // Success, exit retry loop
                        } catch (\Illuminate\Database\QueryException $e) {
                            // Check if it's a unique constraint violation (SQLSTATE 23000)
                            if ($e->getCode() == 23000 && (str_contains($e->getMessage(), 'cash_in_number') || str_contains($e->getMessage(), 'cash_ins_cash_in_number_unique'))) {
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

                    // Post to journal
                    // This creates: Dr. Bank (full amount), Cr. Piutang Usaha (full amount)
                    app(\App\Services\JournalService::class)->postCashIn($cashIn);

                    // If there's overpayment, adjust the journal entry
                    // We need to reclassify overpayment from Piutang to Utang Lain-lain
                    if ($overpaymentAmount > 0) {
                        $this->recordOverpaymentLiability($salePayment, $overpaymentAmount);
                    }
                } else {
                    // If no receivable account found, still create cash movement
                    $bank = \App\Models\Bank::lockForUpdate()->find($salePayment->bank_id);
                    if ($bank) {
                        app(\App\Services\CashMovementService::class)->createMovement(
                            $bank,
                            'SalePayment',
                            $salePayment->id,
                            $salePayment->payment_date,
                            (float) $salePayment->total_amount,
                            0,
                            "Pembayaran Penjualan #{$salePayment->payment_number}"
                        );
                    }
                }
            }
        });

        return redirect()->route('sale-payments.show', $salePayment)
            ->with('success', 'Pembayaran berhasil dikonfirmasi.');
    }

    /**
     * Record overpayment as liability (Utang Lain-lain)
     */
    private function recordOverpaymentLiability(SalePayment $salePayment, float $overpaymentAmount): void
    {
        // Get "Utang Lain-lain" account (2105)
        $otherPayableAccount = ChartOfAccount::where('code', '2105')
            ->where('is_active', true)
            ->first();

        if (!$otherPayableAccount) {
            // Try to find any other payable account
            $otherPayableAccount = ChartOfAccount::where('type', 'liability')
                ->where('is_active', true)
                ->where('code', 'like', '2%')
                ->orderBy('code', 'desc')
                ->first();
        }

        if (!$otherPayableAccount) {
            \Log::warning("Overpayment detected but no 'Utang Lain-lain' account found for SalePayment #{$salePayment->payment_number}");
            return;
        }

        // Get receivable account to reverse the overpayment portion
        $receivableAccount = ChartOfAccount::where('code', '1201')
            ->where('is_active', true)
            ->first();

        if (!$receivableAccount) {
            $receivableAccount = ChartOfAccount::whereIn('type', ['asset', 'piutang'])
                ->where('is_active', true)
                ->orderBy('code')
                ->first();
        }

        if (!$receivableAccount) {
            \Log::warning("Receivable account not found for overpayment adjustment");
            return;
        }

        // Create journal entry for overpayment
        // The CashIn already posted: Dr. Bank (receivable amount), Cr. Piutang Usaha (receivable amount)
        // We need to adjust for the overpayment portion:
        // Dr. Piutang Usaha (overpayment - to reverse the excess), Cr. Utang Lain-lain (overpayment)
        // This is incorrect. Let me reconsider...
        
        // Actually, the logic should be:
        // CashIn posts: Dr. Bank (full amount), Cr. Piutang Usaha (full amount)
        // But we only want to credit Piutang for the receivable portion
        // So we need: Dr. Piutang Usaha (overpayment), Cr. Utang Lain-lain (overpayment)
        
        $journalEntry = JournalEntry::create([
            'journal_number' => JournalEntry::generateJournalNumber(),
            'journal_date' => $salePayment->payment_date,
            'description' => "Kelebihan Pembayaran dari #{$salePayment->payment_number}",
            'reference_type' => 'SalePayment',
            'reference_id' => $salePayment->id,
            'status' => 'posted',
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);

        // Debit: Piutang Usaha (to reverse overpayment portion)
        JournalEntryDetail::create([
            'journal_entry_id' => $journalEntry->id,
            'chart_of_account_id' => $receivableAccount->id,
            'debit' => $overpaymentAmount,
            'credit' => 0,
            'description' => "Penyesuaian kelebihan pembayaran",
        ]);

        // Credit: Utang Lain-lain
        JournalEntryDetail::create([
            'journal_entry_id' => $journalEntry->id,
            'chart_of_account_id' => $otherPayableAccount->id,
            'debit' => 0,
            'credit' => $overpaymentAmount,
            'description' => "Kelebihan pembayaran dari pelanggan",
        ]);
    }

    /**
     * Unconfirm payment
     */
    public function unconfirm(SalePayment $salePayment): RedirectResponse
    {
        if ($salePayment->status === 'pending') {
            return redirect()->route('sale-payments.show', $salePayment)
                ->with('error', 'Pembayaran belum dikonfirmasi.');
        }

        DB::transaction(function () use ($salePayment) {
            // Find and reverse cash in if exists
            $cashIn = CashIn::where('reference_type', 'SalePayment')
                ->where('reference_id', $salePayment->id)
                ->where('status', 'posted')
                ->first();

            if ($cashIn) {
                // Reverse cash in (this will also update bank balance)
                app(\App\Services\JournalService::class)->reverseCashIn($cashIn);
                $cashIn->delete(); // Soft delete
            } else {
                // If no cash in found, delete cash movement manually
                if ($salePayment->bank_id) {
                    $cashMovement = \App\Models\CashMovement::where('reference_type', 'SalePayment')
                        ->where('reference_id', $salePayment->id)
                        ->first();

                    if ($cashMovement) {
                        app(\App\Services\CashMovementService::class)->deleteMovement($cashMovement);
                    }
                }
            }

            $salePayment->update([
                'status' => 'pending',
                'updated_by' => auth()->id(),
            ]);
        });

        return redirect()->route('sale-payments.show', $salePayment)
            ->with('success', 'Konfirmasi pembayaran dibatalkan.');
    }
}
