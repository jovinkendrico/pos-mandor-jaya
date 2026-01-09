<?php

namespace App\Http\Controllers;

use App\Models\SalePayment;
use App\Models\OverpaymentTransaction;
use App\Models\ChartOfAccount;
use App\Services\JournalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OverpaymentController extends Controller
{
    /**
     * Refund overpayment to customer
     */
    public function refund(Request $request, SalePayment $salePayment): RedirectResponse
    {
        // Validate
        if ($salePayment->overpayment_status !== 'pending') {
            return redirect()->back()
                ->with('error', 'Kelebihan pembayaran tidak dapat dikembalikan. Status: ' . $salePayment->overpayment_status);
        }

        if ($salePayment->overpayment_amount <= 0) {
            return redirect()->back()
                ->with('error', 'Tidak ada kelebihan pembayaran untuk dikembalikan.');
        }

        $validated = $request->validate([
            'transaction_date' => 'required|date',
            'bank_id' => 'required|exists:banks,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($salePayment, $validated) {
            // Create overpayment transaction record
            $transaction = OverpaymentTransaction::create([
                'transaction_number' => OverpaymentTransaction::generateTransactionNumber(),
                'sale_payment_id' => $salePayment->id,
                'transaction_type' => 'refund',
                'amount' => $salePayment->overpayment_amount,
                'transaction_date' => $validated['transaction_date'],
                'bank_id' => $validated['bank_id'],
                'notes' => $validated['notes'] ?? null,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Update sale payment status
            $salePayment->update([
                'overpayment_status' => 'refunded',
                'updated_by' => auth()->id(),
            ]);

            // Post journal entry for refund
            app(JournalService::class)->postOverpaymentRefund($transaction);
        });

        return redirect()->route('sale-payments.show', $salePayment)
            ->with('success', 'Kelebihan pembayaran berhasil dikembalikan ke pelanggan.');
    }

    /**
     * Convert overpayment to other income
     */
    public function convertToIncome(Request $request, SalePayment $salePayment): RedirectResponse
    {
        // Validate
        if ($salePayment->overpayment_status !== 'pending') {
            return redirect()->back()
                ->with('error', 'Kelebihan pembayaran tidak dapat dikonversi. Status: ' . $salePayment->overpayment_status);
        }

        if ($salePayment->overpayment_amount <= 0) {
            return redirect()->back()
                ->with('error', 'Tidak ada kelebihan pembayaran untuk dikonversi.');
        }

        $validated = $request->validate([
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($salePayment, $validated) {
            // Create overpayment transaction record
            $transaction = OverpaymentTransaction::create([
                'transaction_number' => OverpaymentTransaction::generateTransactionNumber(),
                'sale_payment_id' => $salePayment->id,
                'transaction_type' => 'convert_to_income',
                'amount' => $salePayment->overpayment_amount,
                'transaction_date' => $validated['transaction_date'],
                'bank_id' => null, // No bank involved in income conversion
                'notes' => $validated['notes'] ?? null,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Update sale payment status
            $salePayment->update([
                'overpayment_status' => 'converted_to_income',
                'updated_by' => auth()->id(),
            ]);

            // Post journal entry for income conversion
            app(JournalService::class)->postOverpaymentToIncome($transaction);
        });

        return redirect()->route('sale-payments.show', $salePayment)
            ->with('success', 'Kelebihan pembayaran berhasil dikonversi menjadi pendapatan lain-lain.');
    }
}
