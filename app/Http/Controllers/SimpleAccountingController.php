<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\Sale;
use App\Models\CashFlow;
use App\Models\Bank;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SimpleAccountingController extends Controller
{
    /**
     * Display payment settlement page
     */
    public function paymentSettlement(): Response
    {
        // Get all purchases and sales with payment status
        $purchases = Purchase::with('supplier')
            ->orderBy('purchase_date', 'desc')
            ->get()
            ->map(function ($purchase) {
                $totalPaid = \App\Models\Payment::getTotalPaid('Purchase', $purchase->id);
                $remainingAmount = $purchase->total_amount - $totalPaid;
                $isFullyPaid = $totalPaid >= $purchase->total_amount;
                $paymentPercentage = $purchase->total_amount > 0 ? ($totalPaid / $purchase->total_amount) * 100 : 0;

                return [
                    'id' => $purchase->id,
                    'number' => $purchase->purchase_number,
                    'date' => $purchase->purchase_date,
                    'total_amount' => $purchase->total_amount,
                    'total_paid' => $totalPaid,
                    'remaining_amount' => $remainingAmount,
                    'is_fully_paid' => $isFullyPaid,
                    'payment_percentage' => $paymentPercentage,
                    'type' => 'Purchase',
                    'supplier' => $purchase->supplier,
                ];
            });

        $sales = Sale::with('customer')
            ->orderBy('sale_date', 'desc')
            ->get()
            ->map(function ($sale) {
                $totalPaid = \App\Models\Payment::getTotalPaid('Sale', $sale->id);
                $remainingAmount = $sale->total_amount - $totalPaid;
                $isFullyPaid = $totalPaid >= $sale->total_amount;
                $paymentPercentage = $sale->total_amount > 0 ? ($totalPaid / $sale->total_amount) * 100 : 0;

                return [
                    'id' => $sale->id,
                    'number' => $sale->sale_number,
                    'date' => $sale->sale_date,
                    'total_amount' => $sale->total_amount,
                    'total_paid' => $totalPaid,
                    'remaining_amount' => $remainingAmount,
                    'is_fully_paid' => $isFullyPaid,
                    'payment_percentage' => $paymentPercentage,
                    'type' => 'Sale',
                    'customer' => $sale->customer,
                ];
            });

        // Combine and sort by date
        $transactions = $purchases->concat($sales)
            ->sortByDesc('date')
            ->values();

        return Inertia::render('accounting/payment-settlement/index', [
            'transactions' => [
                'data' => $transactions
            ]
        ]);
    }

    /**
     * Display cash management page
     */
    public function cashManagement(): Response
    {
        // Get cash flows
        $cashFlows = CashFlow::with('bank')
            ->orderBy('transaction_date', 'desc')
            ->paginate(15);

        // Get summary
        $totalCashIn = CashFlow::where('type', 'in')->sum('amount');
        $totalCashOut = CashFlow::where('type', 'out')->sum('amount');
        $netCashFlow = $totalCashIn - $totalCashOut;

        $summary = [
            'total_cash_in' => $totalCashIn,
            'total_cash_out' => $totalCashOut,
            'net_cash_flow' => $netCashFlow,
        ];

        return Inertia::render('accounting/cash-management/index', [
            'cashTransactions' => $cashFlows,
            'summary' => $summary,
        ]);
    }

    /**
     * Store cash in transaction
     */
    public function storeCashIn(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'description' => 'required|string',
            'bank_id' => 'required|exists:banks,id',
            'transaction_date' => 'required|date',
        ]);

        // Get Sales Revenue category
        $category = \App\Models\Category::where('name', 'Sales Revenue')->first();
        if (!$category) {
            return back()->withErrors(['error' => 'Sales Revenue category not found']);
        }

        CashFlow::create([
            'type' => 'in',
            'category_id' => $category->id,
            'amount' => $request->amount,
            'description' => $request->description,
            'bank_id' => $request->bank_id,
            'transaction_date' => $request->transaction_date,
            'created_by' => auth()->id(),
        ]);

        // Update bank balance
        CashFlow::updateBankBalance($request->bank_id);

        return back()->with('success', 'Cash In transaction recorded successfully');
    }

    /**
     * Store cash out transaction
     */
    public function storeCashOut(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'description' => 'required|string',
            'bank_id' => 'required|exists:banks,id',
            'transaction_date' => 'required|date',
        ]);

        // Get Other Expenses category
        $category = \App\Models\Category::where('name', 'Other Expenses')->first();
        if (!$category) {
            return back()->withErrors(['error' => 'Other Expenses category not found']);
        }

        CashFlow::create([
            'type' => 'out',
            'category_id' => $category->id,
            'amount' => $request->amount,
            'description' => $request->description,
            'bank_id' => $request->bank_id,
            'transaction_date' => $request->transaction_date,
            'created_by' => auth()->id(),
        ]);

        // Update bank balance
        CashFlow::updateBankBalance($request->bank_id);

        return back()->with('success', 'Cash Out transaction recorded successfully');
    }
}
