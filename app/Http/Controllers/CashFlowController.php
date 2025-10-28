<?php

namespace App\Http\Controllers;

use App\Models\CashFlow;
use App\Models\Category;
use App\Models\Bank;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CashFlowController extends Controller
{
    /**
     * Display a listing of cash flows
     */
    public function index(Request $request): JsonResponse
    {
        $query = CashFlow::with(['category', 'bank', 'createdBy'])
            ->orderBy('transaction_date', 'desc');

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by bank
        if ($request->has('bank_id')) {
            $query->where('bank_id', $request->bank_id);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('transaction_date', [$request->start_date, $request->end_date]);
        }

        $cashFlows = $query->paginate(15);

        return response()->json($cashFlows);
    }

    /**
     * Store a new cash flow entry
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:in,out',
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|min:0',
            'description' => 'required|string',
            'bank_id' => 'required|exists:banks,id',
            'transaction_date' => 'required|date',
        ]);

        try {
            DB::beginTransaction();

            $cashFlow = CashFlow::create([
                'type' => $request->type,
                'category_id' => $request->category_id,
                'amount' => $request->amount,
                'description' => $request->description,
                'reference_type' => 'Manual',
                'bank_id' => $request->bank_id,
                'transaction_date' => $request->transaction_date,
                'created_by' => auth()->id(),
            ]);

            // Update bank balance
            CashFlow::updateBankBalance($request->bank_id);

            DB::commit();

            return response()->json([
                'message' => 'Cash flow entry created successfully',
                'data' => $cashFlow->load(['category', 'bank', 'createdBy'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create cash flow entry',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified cash flow
     */
    public function show(CashFlow $cashFlow): JsonResponse
    {
        $cashFlow->load(['category', 'bank', 'createdBy']);

        return response()->json($cashFlow);
    }

    /**
     * Update the specified cash flow
     */
    public function update(Request $request, CashFlow $cashFlow): JsonResponse
    {
        $request->validate([
            'type' => 'sometimes|in:in,out',
            'category_id' => 'sometimes|exists:categories,id',
            'amount' => 'sometimes|numeric|min:0',
            'description' => 'sometimes|string',
            'bank_id' => 'sometimes|exists:banks,id',
            'transaction_date' => 'sometimes|date',
        ]);

        try {
            DB::beginTransaction();

            $oldBankId = $cashFlow->bank_id;

            $cashFlow->update($request->only([
                'type',
                'category_id',
                'amount',
                'description',
                'bank_id',
                'transaction_date'
            ]));

            // Update bank balances
            CashFlow::updateBankBalance($oldBankId);
            if ($request->has('bank_id') && $request->bank_id !== $oldBankId) {
                CashFlow::updateBankBalance($request->bank_id);
            }

            DB::commit();

            return response()->json([
                'message' => 'Cash flow entry updated successfully',
                'data' => $cashFlow->load(['category', 'bank', 'createdBy'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update cash flow entry',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified cash flow
     */
    public function destroy(CashFlow $cashFlow): JsonResponse
    {
        try {
            DB::beginTransaction();

            $bankId = $cashFlow->bank_id;
            $cashFlow->delete();

            // Update bank balance
            CashFlow::updateBankBalance($bankId);

            DB::commit();

            return response()->json([
                'message' => 'Cash flow entry deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete cash flow entry',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cash flow summary for a period
     */
    public function getSummary(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // Get overall cash flow
        $cashFlow = CashFlow::getCashFlow($startDate, $endDate);

        // Get cash flow by category
        $cashFlowByCategory = CashFlow::getCashFlowByCategory($startDate, $endDate);

        // Get cash flow by type
        $cashInByCategory = $cashFlowByCategory->where('type', 'in')->groupBy('category_id');
        $cashOutByCategory = $cashFlowByCategory->where('type', 'out')->groupBy('category_id');

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => $cashFlow,
            'cash_in_by_category' => $cashInByCategory,
            'cash_out_by_category' => $cashOutByCategory,
        ]);
    }

    /**
     * Get profit and loss statement
     */
    public function getProfitLoss(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // Get revenue (cash in from sales)
        $revenue = CashFlow::where('type', 'in')
            ->whereHas('category', function ($query) {
                $query->where('name', 'Sales Revenue');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Get COGS (cash out for purchases)
        $cogs = CashFlow::where('type', 'out')
            ->whereHas('category', function ($query) {
                $query->where('name', 'Cost of Goods Sold');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Get operating expenses
        $operatingExpenses = CashFlow::where('type', 'out')
            ->whereHas('category', function ($query) {
                $query->where('name', 'Operating Expenses');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Get other expenses
        $otherExpenses = CashFlow::where('type', 'out')
            ->whereHas('category', function ($query) {
                $query->where('name', 'Other Expenses');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        $grossProfit = $revenue - $cogs;
        $totalExpenses = $operatingExpenses + $otherExpenses;
        $netProfit = $grossProfit - $totalExpenses;

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'revenue' => $revenue,
            'cogs' => $cogs,
            'gross_profit' => $grossProfit,
            'operating_expenses' => $operatingExpenses,
            'other_expenses' => $otherExpenses,
            'total_expenses' => $totalExpenses,
            'net_profit' => $netProfit,
        ]);
    }

    /**
     * Get bank balances
     */
    public function getBankBalances(): JsonResponse
    {
        $banks = Bank::with('cashFlows')->get();

        $bankBalances = $banks->map(function ($bank) {
            $cashIn = $bank->cashFlows()->where('type', 'in')->sum('amount');
            $cashOut = $bank->cashFlows()->where('type', 'out')->sum('amount');
            $calculatedBalance = $cashIn - $cashOut;

            return [
                'id' => $bank->id,
                'name' => $bank->name,
                'type' => $bank->type,
                'stored_balance' => $bank->balance,
                'calculated_balance' => $calculatedBalance,
                'cash_in' => $cashIn,
                'cash_out' => $cashOut,
            ];
        });

        return response()->json($bankBalances);
    }
}
