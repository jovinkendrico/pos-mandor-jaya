<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CashFlow;
use App\Models\Payment;
use App\Models\Bank;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class AccountingController extends Controller
{
    /**
     * Display accounting dashboard
     */
    public function dashboard(): Response
    {
        // Get summary data for dashboard
        $totalCashIn = CashFlow::where('type', 'in')->sum('amount');
        $totalCashOut = CashFlow::where('type', 'out')->sum('amount');
        $netCashFlow = $totalCashIn - $totalCashOut;
        $totalPayments = Payment::count();
        $pendingPayments = Payment::whereHas('reference', function ($query) {
            $query->where('status', 'pending');
        })->count();

        $summary = [
            'total_cash_in' => $totalCashIn,
            'total_cash_out' => $totalCashOut,
            'net_cash_flow' => $netCashFlow,
            'total_payments' => $totalPayments,
            'pending_payments' => $pendingPayments,
        ];

        return Inertia::render('accounting/dashboard', [
            'summary' => $summary,
        ]);
    }

    /**
     * Display categories index
     */
    public function categoriesIndex(): Response
    {
        $categories = Category::with('parent')
            ->orderBy('type')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('accounting/categories/index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Display payments index
     */
    public function paymentsIndex(): Response
    {
        $payments = Payment::with(['bank', 'createdBy', 'details', 'reference'])
            ->orderBy('payment_date', 'desc')
            ->paginate(15);

        $banks = Bank::all();
        $purchases = \App\Models\Purchase::with('supplier')->get();
        $sales = \App\Models\Sale::with('customer')->get();

        return Inertia::render('accounting/payments/index', [
            'payments' => $payments,
            'banks' => $banks,
            'purchases' => $purchases,
            'sales' => $sales,
        ]);
    }

    /**
     * Display cash flows index
     */
    public function cashFlowsIndex(): Response
    {
        $cashFlows = CashFlow::with(['category', 'bank', 'createdBy'])
            ->orderBy('transaction_date', 'desc')
            ->paginate(15);

        $categories = Category::all();
        $banks = Bank::all();

        return Inertia::render('accounting/cash-flows/index', [
            'cashFlows' => $cashFlows,
            'categories' => $categories,
            'banks' => $banks,
        ]);
    }

    /**
     * Display cash flow report
     */
    public function cashFlowReport(Request $request): Response
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));

        $summary = null;
        if ($request->has('start_date') && $request->has('end_date')) {
            $summary = CashFlow::getCashFlow($startDate, $endDate);
            $summary['period'] = [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ];
            $summary['cash_in_by_category'] = CashFlow::getCashFlowByCategory($startDate, $endDate)
                ->where('type', 'in')
                ->groupBy('category_id');
            $summary['cash_out_by_category'] = CashFlow::getCashFlowByCategory($startDate, $endDate)
                ->where('type', 'out')
                ->groupBy('category_id');
        }

        return Inertia::render('accounting/reports/cash-flow', [
            'summary' => $summary,
        ]);
    }

    /**
     * Display profit & loss report
     */
    public function profitLossReport(Request $request): Response
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));

        $profitLoss = null;
        if ($request->has('start_date') && $request->has('end_date')) {
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

            $profitLoss = [
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
            ];
        }

        return Inertia::render('accounting/reports/profit-loss', [
            'profitLoss' => $profitLoss,
        ]);
    }

    /**
     * Display bank balances
     */
    public function bankBalances(): Response
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

        return Inertia::render('accounting/bank-balances', [
            'banks' => $bankBalances,
        ]);
    }
}
