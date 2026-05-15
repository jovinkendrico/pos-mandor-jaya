<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class MonthlyBalanceSheetController extends Controller
{
    /**
     * Display monthly balance sheet report
     */
    public function index(Request $request): Response
    {
        $year = $request->get('year', now()->year);
        $data = $this->getMonthlyBalanceSheetData($year);

        return Inertia::render('reports/monthly-balance-sheet/index', array_merge($data, [
            'year' => $year,
            'availableYears' => $this->getAvailableYears(),
        ]));
    }

    /**
     * Print monthly balance sheet report
     */
    public function print(Request $request)
    {
        $year = $request->get('year', now()->year);
        $data = $this->getMonthlyBalanceSheetData($year);

        $pdf = Pdf::loadView('pdf.reports.monthly-balance-sheet', array_merge($data, [
            'title' => 'Laporan Neraca Bulanan (Detail)',
            'year' => $year,
        ]))->setPaper('a4', 'landscape');

        return $pdf->download('laporan-neraca-bulanan-detail-' . $year . '.pdf');
    }

    /**
     * Get all monthly balance sheet data including details
     */
    private function getMonthlyBalanceSheetData(int $year): array
    {
        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $date = Carbon::createFromDate($year, $m, 1)->endOfMonth();
            $months[] = [
                'name' => $date->translatedFormat('F'),
                'date' => $date->format('Y-m-d'),
                'month' => $m,
            ];
        }

        $assetAccounts = ChartOfAccount::where('type', 'asset')->where('is_active', true)->orderBy('code')->get();
        $liabilityAccounts = ChartOfAccount::where('type', 'liability')->where('is_active', true)->orderBy('code')->get();
        $equityAccounts = ChartOfAccount::where('type', 'equity')->where('is_active', true)->orderBy('code')->get();

        $assetDetails = [];
        $liabilityDetails = [];
        $equityDetails = [];
        
        $monthlyTotals = [
            'assets' => array_fill(0, 12, 0),
            'liabilities' => array_fill(0, 12, 0),
            'equity' => array_fill(0, 12, 0),
            'net_profit' => array_fill(0, 12, 0),
        ];

        // Process Assets
        foreach ($assetAccounts as $account) {
            $monthlyBalances = [];
            $hasBalance = false;
            foreach ($months as $idx => $month) {
                $balance = $this->getAccountBalanceAsOf($account->id, $month['date']);
                $monthlyBalances[] = $balance;
                $monthlyTotals['assets'][$idx] += $balance;
                if ($balance != 0) $hasBalance = true;
            }
            if ($hasBalance) {
                $assetDetails[] = [
                    'code' => $account->code,
                    'name' => $account->name,
                    'balances' => $monthlyBalances,
                ];
            }
        }

        // Process Liabilities
        foreach ($liabilityAccounts as $account) {
            $monthlyBalances = [];
            $hasBalance = false;
            foreach ($months as $idx => $month) {
                $balance = $this->getAccountBalanceAsOf($account->id, $month['date']);
                $monthlyBalances[] = $balance;
                $monthlyTotals['liabilities'][$idx] += $balance;
                if ($balance != 0) $hasBalance = true;
            }
            if ($hasBalance) {
                $liabilityDetails[] = [
                    'code' => $account->code,
                    'name' => $account->name,
                    'balances' => $monthlyBalances,
                ];
            }
        }

        // Process Equity
        foreach ($equityAccounts as $account) {
            $monthlyBalances = [];
            $hasBalance = false;
            foreach ($months as $idx => $month) {
                $balance = $this->getAccountBalanceAsOf($account->id, $month['date']);
                $monthlyBalances[] = $balance;
                $monthlyTotals['equity'][$idx] += $balance;
                if ($balance != 0) $hasBalance = true;
            }
            if ($hasBalance) {
                $equityDetails[] = [
                    'code' => $account->code,
                    'name' => $account->name,
                    'balances' => $monthlyBalances,
                ];
            }
        }

        // Add Net Profit (Retained Earnings for current year) to Equity
        $netProfitBalances = [];
        foreach ($months as $idx => $month) {
            $yearStart = Carbon::parse($month['date'])->startOfYear()->format('Y-m-d');
            $netProfit = $this->calculateNetProfit($yearStart, $month['date']);
            $netProfitBalances[] = $netProfit;
            $monthlyTotals['net_profit'][$idx] = $netProfit;
            $monthlyTotals['equity'][$idx] += $netProfit;
        }
        
        $equityDetails[] = [
            'code' => 'L/R',
            'name' => 'Laba/Rugi Tahun Berjalan',
            'balances' => $netProfitBalances,
        ];

        return [
            'monthNames' => array_column($months, 'name'),
            'assetDetails' => $assetDetails,
            'liabilityDetails' => $liabilityDetails,
            'equityDetails' => $equityDetails,
            'monthlyTotals' => $monthlyTotals,
        ];
    }

    /**
     * Get available years for filtering
     */
    private function getAvailableYears(): array
    {
        $firstEntry = JournalEntry::where('status', 'posted')
            ->orderBy('journal_date', 'asc')
            ->first();
            
        $startYear = $firstEntry ? Carbon::parse($firstEntry->journal_date)->year : now()->year;
        $endYear = now()->year;
        
        $years = [];
        for ($y = $endYear; $y >= $startYear; $y--) {
            $years[] = $y;
        }
        
        return $years;
    }

    /**
     * Get account balance as of a specific date
     */
    private function getAccountBalanceAsOf(int $accountId, string $asOfDate): float
    {
        $account = ChartOfAccount::find($accountId);
        if (!$account) {
            return 0;
        }

        $query = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entry_details.chart_of_account_id', $accountId)
            ->where('journal_entries.status', 'posted')
            ->whereNull('journal_entries.deleted_at')
            ->whereDate('journal_entries.journal_date', '<=', $asOfDate);

        $debit = (float) $query->sum('journal_entry_details.debit') ?? 0;
        $credit = (float) $query->sum('journal_entry_details.credit') ?? 0;

        // Calculate balance based on account type
        if ($account->type === 'asset' || $account->type === 'expense') {
            return $debit - $credit;
        } else {
            return $credit - $debit;
        }
    }

    /**
     * Calculate net profit for a date range
     */
    private function calculateNetProfit(string $dateFrom, string $dateTo): float
    {
        // Get all income accounts
        $incomeAccounts = ChartOfAccount::whereIn('type', ['income', 'revenue', 'pendapatan'])
            ->where('is_active', true)
            ->pluck('id');

        // Get all expense accounts
        $expenseAccounts = ChartOfAccount::whereIn('type', ['expense', 'biaya', 'pengeluaran'])
            ->where('is_active', true)
            ->pluck('id');

        // Calculate total income (Credit - Debit)
        $totalIncome = 0;
        if ($incomeAccounts->isNotEmpty()) {
            $incomeCredit = (float) JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
                ->whereIn('journal_entry_details.chart_of_account_id', $incomeAccounts)
                ->where('journal_entries.status', 'posted')
                ->whereNull('journal_entries.deleted_at')
                ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
                ->whereDate('journal_entries.journal_date', '<=', $dateTo)
                ->sum('journal_entry_details.credit') ?? 0;

            $incomeDebit = (float) JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
                ->whereIn('journal_entry_details.chart_of_account_id', $incomeAccounts)
                ->where('journal_entries.status', 'posted')
                ->whereNull('journal_entries.deleted_at')
                ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
                ->whereDate('journal_entries.journal_date', '<=', $dateTo)
                ->sum('journal_entry_details.debit') ?? 0;

            $totalIncome = $incomeCredit - $incomeDebit;
        }

        // Calculate total expense (Debit - Credit)
        $totalExpense = 0;
        if ($expenseAccounts->isNotEmpty()) {
            $expenseDebit = (float) JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
                ->whereIn('journal_entry_details.chart_of_account_id', $expenseAccounts)
                ->where('journal_entries.status', 'posted')
                ->whereNull('journal_entries.deleted_at')
                ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
                ->whereDate('journal_entries.journal_date', '<=', $dateTo)
                ->sum('journal_entry_details.debit') ?? 0;

            $expenseCredit = (float) JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
                ->whereIn('journal_entry_details.chart_of_account_id', $expenseAccounts)
                ->where('journal_entries.status', 'posted')
                ->whereNull('journal_entries.deleted_at')
                ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
                ->whereDate('journal_entries.journal_date', '<=', $dateTo)
                ->sum('journal_entry_details.credit') ?? 0;

            $totalExpense = $expenseDebit - $expenseCredit;
        }

        return $totalIncome - $totalExpense;
    }
}
