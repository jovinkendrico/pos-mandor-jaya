<?php

namespace App\Http\Controllers;

use App\Models\Bank;
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

        $data = $this->getProfitLossData($dateFrom, $dateTo);

        return Inertia::render('accounting/profit-loss/index', array_merge($data, [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]));
    }

    /**
     * Print profit and loss report as PDF
     */
    public function print(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        $data = $this->getProfitLossData($dateFrom, $dateTo);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.reports.profit-loss', array_merge($data, [
            'title' => 'Laporan Laba Rugi',
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]))->setPaper('a4', 'portrait');

        return $pdf->download('laporan-laba-rugi-' . $dateFrom . '-to-' . $dateTo . '.pdf');
    }

    /**
     * Get profit and loss data calculation
     */
    private function getProfitLossData(string $dateFrom, string $dateTo): array
    {
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
            if ($income != 0) {
                $incomeDetails[] = [
                    'code' => $account->code,
                    'name' => $account->name,
                    'amount' => $income,
                ];
                $totalIncome += $income;
            }
        }

        // Calculate gross profit (Income - HPP)
        // Get all HPP accounts (5100-5199)
        $hppAccounts = ChartOfAccount::where('code', '>=', '5100')
            ->where('code', '<', '5200')
            ->where('is_active', true)
            ->get();

        $totalHPP = 0;
        foreach ($hppAccounts as $account) {
            $totalHPP += $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'expense');
        }

        // Calculate expense totals (HPP already excluded from query above)
        $totalExpense = 0;
        $expenseDetails = [];
        foreach ($expenseAccounts as $account) {
            $expense = $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'expense');
            if ($expense != 0) {
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

        $expenseByBank = $this->getExpenseByBank($expenseAccounts->all(), $dateFrom, $dateTo);

        return [
            'incomeDetails' => $incomeDetails,
            'expenseDetails' => $expenseDetails,
            'expenseByBank' => $expenseByBank,
            'totalIncome' => $totalIncome,
            'totalHPP' => $totalHPP,
            'grossProfit' => $grossProfit,
            'totalExpense' => $totalExpense, // Already excludes HPP
            'netProfit' => $netProfit,
        ];
    }

    /**
     * Get expense details grouped by bank/kas
     */
    private function getExpenseByBank(array $expenseAccounts, string $dateFrom, string $dateTo): array
    {
        if (empty($expenseAccounts)) {
            return [];
        }

        $accountIds = array_map(fn($a) => $a->id, $expenseAccounts);
        $accountMap = [];
        foreach ($expenseAccounts as $a) {
            $accountMap[$a->id] = ['code' => $a->code, 'name' => $a->name];
        }

        // Single query: group by account + bank
        $rows = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', function ($join) {
                $join->on('je.id', '=', 'jed.journal_entry_id')
                     ->whereNull('je.deleted_at');
            })
            ->join('chart_of_accounts as coa', 'coa.id', '=', 'jed.chart_of_account_id')
            ->leftJoin('cash_outs as co', function ($join) {
                $join->on('je.reference_id', '=', 'co.id')
                     ->where('je.reference_type', '=', 'CashOut')
                     ->whereNull('co.deleted_at');
            })
            ->leftJoin('banks', function ($join) {
                $join->on('co.bank_id', '=', 'banks.id')
                     ->whereNull('banks.deleted_at');
            })
            ->whereIn('jed.chart_of_account_id', $accountIds)
            ->where('je.status', 'posted')
            ->whereDate('je.journal_date', '>=', $dateFrom)
            ->whereDate('je.journal_date', '<=', $dateTo)
            ->select(
                'jed.chart_of_account_id',
                'coa.code as coa_code',
                'banks.id as bank_id',
                'banks.name as bank_name',
                DB::raw('SUM(jed.debit) - SUM(jed.credit) as amount')
            )
            ->groupBy('jed.chart_of_account_id', 'coa.code', 'banks.id', 'banks.name')
            ->orderBy('banks.name')
            ->orderBy('coa.code')
            ->get();

        // Collect all banks in order
        $banksOrder = [];
        $grouped = []; // bank_key => ['bank_id', 'bank_name', accounts...]

        foreach ($rows as $row) {
            $bankKey = $row->bank_id ?? 'lainnya';
            if (!isset($grouped[$bankKey])) {
                $grouped[$bankKey] = [
                    'bank_id' => $row->bank_id,
                    'bank_name' => $row->bank_name ?? 'Lainnya',
                    'details' => [],
                    'total' => 0,
                ];
                $banksOrder[] = $bankKey;
            }
            $amount = (float) $row->amount;
            if ($amount != 0) {
                $grouped[$bankKey]['details'][] = [
                    'code' => $accountMap[$row->chart_of_account_id]['code'],
                    'name' => $accountMap[$row->chart_of_account_id]['name'],
                    'amount' => $amount,
                ];
                $grouped[$bankKey]['total'] += $amount;
            }
        }

        // Filter out banks with zero total and return in order
        $result = [];
        foreach ($banksOrder as $key) {
            if ($grouped[$key]['total'] != 0) {
                $result[] = $grouped[$key];
            }
        }

        return $result;
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

