<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\PaymentDetail;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Bank;
use App\Models\CashFlow;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['bank', 'createdBy', 'details'])
            ->orderBy('payment_date', 'desc');

        // Filter by reference type
        if ($request->has('reference_type')) {
            $query->where('reference_type', $request->reference_type);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('payment_date', [$request->start_date, $request->end_date]);
        }

        $payments = $query->paginate(15);

        return response()->json($payments);
    }

    /**
     * Store a new payment
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'reference_type' => 'required|in:Purchase,Sale',
            'reference_id' => 'required|integer',
            'payment_date' => 'required|date',
            'amount_paid' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,bank_transfer,check,other',
            'bank_id' => 'nullable|exists:banks,id',
            'notes' => 'nullable|string',
            'payment_details' => 'array',
            'payment_details.*.amount' => 'required|numeric|min:0',
            'payment_details.*.payment_date' => 'required|date',
            'payment_details.*.payment_method' => 'required|in:cash,bank_transfer,check,other',
            'payment_details.*.bank_id' => 'nullable|exists:banks,id',
            'payment_details.*.notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // Generate payment number
            $paymentNumber = Payment::generatePaymentNumber();

            // Create payment
            $payment = Payment::create([
                'payment_number' => $paymentNumber,
                'reference_type' => $request->reference_type,
                'reference_id' => $request->reference_id,
                'payment_date' => $request->payment_date,
                'amount_paid' => $request->amount_paid,
                'payment_method' => $request->payment_method,
                'bank_id' => $request->bank_id,
                'notes' => $request->notes,
                'created_by' => auth()->id(),
            ]);

            // Create payment details if provided
            if ($request->has('payment_details')) {
                foreach ($request->payment_details as $detail) {
                    PaymentDetail::create([
                        'payment_id' => $payment->id,
                        'amount' => $detail['amount'],
                        'payment_date' => $detail['payment_date'],
                        'payment_method' => $detail['payment_method'],
                        'bank_id' => $detail['bank_id'] ?? null,
                        'notes' => $detail['notes'] ?? null,
                        'created_by' => auth()->id(),
                    ]);
                }
            }

            // Create cash flow entry
            $this->createCashFlowEntry($payment);

            DB::commit();

            return response()->json([
                'message' => 'Payment created successfully',
                'data' => $payment->load(['bank', 'createdBy', 'details'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified payment
     */
    public function show(Payment $payment): JsonResponse
    {
        $payment->load(['bank', 'createdBy', 'details', 'reference']);

        return response()->json($payment);
    }

    /**
     * Update the specified payment
     */
    public function update(Request $request, Payment $payment): JsonResponse
    {
        $request->validate([
            'payment_date' => 'sometimes|date',
            'amount_paid' => 'sometimes|numeric|min:0',
            'payment_method' => 'sometimes|in:cash,bank_transfer,check,other',
            'bank_id' => 'nullable|exists:banks,id',
            'notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // Update payment
            $payment->update($request->only([
                'payment_date',
                'amount_paid',
                'payment_method',
                'bank_id',
                'notes'
            ]));

            // Update cash flow entry
            $this->updateCashFlowEntry($payment);

            DB::commit();

            return response()->json([
                'message' => 'Payment updated successfully',
                'data' => $payment->load(['bank', 'createdBy', 'details'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified payment
     */
    public function destroy(Payment $payment): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Delete cash flow entry
            $this->deleteCashFlowEntry($payment);

            // Delete payment details
            $payment->details()->delete();

            // Delete payment
            $payment->delete();

            DB::commit();

            return response()->json([
                'message' => 'Payment deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payment status for a transaction
     */
    public function getPaymentStatus(Request $request): JsonResponse
    {
        $request->validate([
            'reference_type' => 'required|in:Purchase,Sale',
            'reference_id' => 'required|integer',
        ]);

        $referenceType = $request->reference_type;
        $referenceId = $request->reference_id;

        // Get transaction
        if ($referenceType === 'Purchase') {
            $transaction = Purchase::findOrFail($referenceId);
        } else {
            $transaction = Sale::findOrFail($referenceId);
        }

        $totalPaid = Payment::getTotalPaid($referenceType, $referenceId);
        $isFullyPaid = Payment::isFullyPaid($referenceType, $referenceId, (float) $transaction->total_amount);
        $remainingAmount = $transaction->total_amount - $totalPaid;

        return response()->json([
            'transaction' => $transaction,
            'total_amount' => $transaction->total_amount,
            'total_paid' => $totalPaid,
            'remaining_amount' => $remainingAmount,
            'is_fully_paid' => $isFullyPaid,
            'payment_percentage' => $transaction->total_amount > 0 ? ($totalPaid / $transaction->total_amount) * 100 : 0,
        ]);
    }

    /**
     * Create cash flow entry for payment
     */
    private function createCashFlowEntry(Payment $payment): void
    {
        // Determine category based on reference type
        $categoryName = $payment->reference_type === 'Sale' ? 'Sales Revenue' : 'Cost of Goods Sold';
        $category = Category::where('name', $categoryName)->first();

        if ($category) {
            CashFlow::create([
                'type' => $payment->reference_type === 'Sale' ? 'in' : 'out',
                'category_id' => $category->id,
                'amount' => $payment->amount_paid,
                'description' => "Payment for {$payment->reference_type} #{$payment->reference_id}",
                'reference_type' => $payment->reference_type,
                'reference_id' => $payment->reference_id,
                'bank_id' => $payment->bank_id,
                'transaction_date' => $payment->payment_date,
                'created_by' => auth()->id(),
            ]);

            // Update bank balance
            CashFlow::updateBankBalance($payment->bank_id);
        }
    }

    /**
     * Update cash flow entry for payment
     */
    private function updateCashFlowEntry(Payment $payment): void
    {
        // Find and update existing cash flow entry
        $cashFlow = CashFlow::where('reference_type', $payment->reference_type)
            ->where('reference_id', $payment->reference_id)
            ->first();

        if ($cashFlow) {
            $cashFlow->update([
                'amount' => $payment->amount_paid,
                'bank_id' => $payment->bank_id,
                'transaction_date' => $payment->payment_date,
            ]);

            // Update bank balance
            CashFlow::updateBankBalance($payment->bank_id);
        }
    }

    /**
     * Delete cash flow entry for payment
     */
    private function deleteCashFlowEntry(Payment $payment): void
    {
        $cashFlow = CashFlow::where('reference_type', $payment->reference_type)
            ->where('reference_id', $payment->reference_id)
            ->first();

        if ($cashFlow) {
            $cashFlow->delete();
            CashFlow::updateBankBalance($payment->bank_id);
        }
    }
}
