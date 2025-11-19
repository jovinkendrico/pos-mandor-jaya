<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSalePaymentRequest;
use App\Http\Requests\UpdateSalePaymentRequest;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\Bank;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class SalePaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $payments = SalePayment::with(['sales.customer', 'bank', 'items.sale'])
            ->orderBy('payment_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15);

        return Inertia::render('transaction/sale-payment/index', [
            'payments' => $payments,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $banks = Bank::orderBy('name')->get();
        $sales = Sale::with('customer')
            ->orderBy('sale_date', 'desc')
            ->orderBy('id', 'desc')
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
        $salePayment->load(['sales.customer', 'bank', 'items.sale']);

        return Inertia::render('transaction/sale-payment/show', [
            'payment' => $salePayment,
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

        $sales = Sale::with('customer')
            ->orderBy('sale_date', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($sale) use ($existingSaleIds) {
                // Show sales that are either:
                // 1. Already in this payment (for editing), OR
                // 2. Not fully paid (remaining_amount > 0)
                return in_array($sale->id, $existingSaleIds) || $sale->remaining_amount > 0;
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

        return Inertia::render('transaction/sale-payment/edit', [
            'payment' => $salePayment,
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
            $salePayment->update(['status' => 'confirmed']);

            // Update bank balance if bank is selected
            if ($salePayment->bank_id) {
                $bank = \App\Models\Bank::lockForUpdate()->find($salePayment->bank_id);
                if ($bank) {
                    $bank->increment('balance', $salePayment->total_amount);
                }
            }
        });

        return redirect()->route('sale-payments.show', $salePayment)
            ->with('success', 'Pembayaran berhasil dikonfirmasi.');
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
            // Restore bank balance if bank is selected
            if ($salePayment->bank_id) {
                $bank = \App\Models\Bank::lockForUpdate()->find($salePayment->bank_id);
                if ($bank) {
                    $bank->decrement('balance', $salePayment->total_amount);
                }
            }

            $salePayment->update(['status' => 'pending']);
        });

        return redirect()->route('sale-payments.show', $salePayment)
            ->with('success', 'Konfirmasi pembayaran dibatalkan.');
    }
}
