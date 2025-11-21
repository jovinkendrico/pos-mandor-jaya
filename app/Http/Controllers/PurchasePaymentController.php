<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchasePaymentRequest;
use App\Http\Requests\UpdatePurchasePaymentRequest;
use App\Models\Purchase;
use App\Models\PurchasePayment;
use App\Models\Bank;
use App\Models\CashOut;
use App\Models\ChartOfAccount;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class PurchasePaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $payments = PurchasePayment::with(['purchases.supplier', 'bank', 'items.purchase'])
            ->orderBy('payment_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15);

        return Inertia::render('transaction/purchase-payment/index', [
            'payments' => $payments,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $banks = Bank::orderBy('name')->get();
        $purchases = Purchase::with('supplier')
            ->orderBy('purchase_date', 'desc')
            ->orderBy('id', 'desc')
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
     * Store a newly created resource in storage.
     */
    public function store(StorePurchasePaymentRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            // Calculate total amount from items
            $totalAmount = collect($request->items)->sum('amount');

            // Create payment
            $payment = PurchasePayment::create([
                'payment_number' => PurchasePayment::generatePaymentNumber(),
                'payment_date' => $request->payment_date,
                'total_amount' => $totalAmount,
                'bank_id' => $request->bank_id,
                'payment_method' => $request->payment_method,
                'reference_number' => $request->reference_number,
                'notes' => $request->notes,
                'status' => $request->status ?? 'pending',
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
        $purchasePayment->load(['purchases.supplier', 'bank', 'items.purchase']);

        return Inertia::render('transaction/purchase-payment/show', [
            'payment' => $purchasePayment,
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

        $purchases = Purchase::with('supplier')
            ->orderBy('purchase_date', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($purchase) use ($existingPurchaseIds) {
                // Show purchases that are either:
                // 1. Already in this payment (for editing), OR
                // 2. Not fully paid (remaining_amount > 0)
                return in_array($purchase->id, $existingPurchaseIds) || $purchase->remaining_amount > 0;
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

        return Inertia::render('transaction/purchase-payment/edit', [
            'payment' => $purchasePayment,
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

        // Calculate total amount from items
        $totalAmount = collect($request->items)->sum('amount');

        // Update payment
        $purchasePayment->update([
            'payment_date' => $request->payment_date,
            'total_amount' => $totalAmount,
            'bank_id' => $request->bank_id,
            'payment_method' => $request->payment_method,
            'reference_number' => $request->reference_number,
            'notes' => $request->notes,
        ]);

        // Delete old items and create new ones
        $purchasePayment->items()->delete();
        foreach ($request->items as $item) {
            $purchasePayment->items()->create([
                'purchase_id' => $item['purchase_id'],
                'amount' => $item['amount'],
            ]);
        }

        return redirect()->route('purchase-payments.show', $purchasePayment)
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
            $purchasePayment->update(['status' => 'confirmed']);

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
                    $cashOut = CashOut::create([
                        'cash_out_number' => CashOut::generateCashOutNumber(),
                        'cash_out_date' => $purchasePayment->payment_date,
                        'bank_id' => $purchasePayment->bank_id,
                        'chart_of_account_id' => $payableAccount->id, // Hutang Usaha, bukan biaya
                        'amount' => $purchasePayment->total_amount,
                        'description' => "Pembayaran Pembelian #{$purchasePayment->payment_number}",
                        'status' => 'posted', // Auto post karena sudah confirmed
                        'reference_type' => 'PurchasePayment',
                        'reference_id' => $purchasePayment->id,
                    ]);

                    // Post to journal (this will also update bank balance)
                    // JournalService akan membuat: Debit Hutang Usaha, Credit Bank
                    app(\App\Services\JournalService::class)->postCashOut($cashOut);
                } else {
                    // If no payable account found, still update bank balance manually
                    $bank = \App\Models\Bank::lockForUpdate()->find($purchasePayment->bank_id);
                    if ($bank) {
                        $bank->decrement('balance', $purchasePayment->total_amount);
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
            // Find and reverse cash out if exists
            $cashOut = CashOut::where('reference_type', 'PurchasePayment')
                ->where('reference_id', $purchasePayment->id)
                ->where('status', 'posted')
                ->first();

            if ($cashOut) {
                // Reverse cash out (this will also update bank balance)
                app(\App\Services\JournalService::class)->reverseCashOut($cashOut);
                $cashOut->delete(); // Soft delete
            } else {
                // If no cash out found, restore bank balance manually
                if ($purchasePayment->bank_id) {
                    $bank = \App\Models\Bank::lockForUpdate()->find($purchasePayment->bank_id);
                    if ($bank) {
                        $bank->increment('balance', $purchasePayment->total_amount);
                    }
                }
            }

            $purchasePayment->update(['status' => 'pending']);
        });

        return redirect()->route('purchase-payments.show', $purchasePayment)
            ->with('success', 'Konfirmasi pembayaran dibatalkan.');
    }
}
