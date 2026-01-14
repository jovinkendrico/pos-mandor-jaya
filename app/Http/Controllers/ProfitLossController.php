<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProfitLossController extends Controller
{
    /**
     * Display profit and loss report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get all income accounts (type: income, revenue, pendapatan)
        $incomeAccounts = ChartOfAccount::whereIn('type', ['income', 'revenue', 'pendapatan'])
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        // Get all expense accounts (type: expense, biaya, pengeluaran)
        // Exclude HPP accounts (5100-5199) as they are already shown separately
        $expenseAccounts = ChartOfAccount::whereIn('type', ['expense', 'biaya', 'pengeluaran'])
            ->where('is_active', true)
            ->where(function ($query) {
                $query->where('code', '<', '5100')
                    ->orWhere('code', '>=', '5200');
            })
            ->orderBy('code')
            ->get();

        // Calculate income totals
        $totalIncome = 0;
        $incomeDetails = [];
        foreach ($incomeAccounts as $account) {
            $income = $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'income');
            if ($income > 0) {
                $incomeDetails[] = [
                    'code' => $account->code,
                    'name' => $account->name,
                    'amount' => $income,
                ];
                $totalIncome += $income;
            }
        }

        // Calculate gross profit (Income - HPP)
        $hppAccount = ChartOfAccount::where('code', '5101')
            ->where('is_active', true)
            ->first();

        $totalHPP = 0;
        if ($hppAccount) {
            $totalHPP = $this->getAccountBalance($hppAccount->id, $dateFrom, $dateTo, 'expense');
        }

        // Calculate expense totals (HPP already excluded from query above)
        $totalExpense = 0;
        $expenseDetails = [];
        foreach ($expenseAccounts as $account) {
            $expense = $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'expense');
            if ($expense > 0) {
                $expenseDetails[] = [
                    'code' => $account->code,
                    'name' => $account->name,
                    'amount' => $expense,
                ];
                $totalExpense += $expense;
            }
        }

        $grossProfit = $totalIncome - $totalHPP;
        $netProfit = $grossProfit - $totalExpense; // Total expense already excludes HPP

        return Inertia::render('accounting/profit-loss/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'incomeDetails' => $incomeDetails,
            'expenseDetails' => $expenseDetails,
            'totalIncome' => $totalIncome,
            'totalHPP' => $totalHPP,
            'grossProfit' => $grossProfit,
            'totalExpense' => $totalExpense, // Already excludes HPP
            'netProfit' => $netProfit,
        ]);
    }

    /**
     * Get account balance for a date range
     */
    private function getAccountBalance(int $accountId, string $dateFrom, string $dateTo, string $type = 'both'): float
    {
        $query = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entry_details.chart_of_account_id', $accountId)
            ->where('journal_entries.status', 'posted')
            ->whereNull('journal_entries.deleted_at')
            ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
            ->whereDate('journal_entries.journal_date', '<=', $dateTo);

        $debit = (float) $query->sum('journal_entry_details.debit') ?? 0;
        $credit = (float) $query->sum('journal_entry_details.credit') ?? 0;

        if ($type === 'income') {
            // Income accounts: Credit - Debit
            return $credit - $debit;
        } elseif ($type === 'expense') {
            // Expense accounts: Debit - Credit
            return $debit - $credit;
        } elseif ($type === 'debit') {
            return $debit;
        } elseif ($type === 'credit') {
            return $credit;
        } else {
            return $debit - $credit;
        }
    }
}

