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
        
        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $date = Carbon::createFromDate($year, $m, 1)->endOfMonth();
            if ($date->isFuture() && $date->month > now()->month && $date->year == now()->year) {
                // Skip future months if they are beyond current month in current year
                // But let's show all months if it's a past year
            }
            $months[] = [
                'name' => $date->translatedFormat('F'),
                'date' => $date->format('Y-m-d'),
                'month' => $m,
            ];
        }

        // Get account categories
        $assetAccounts = ChartOfAccount::where('type', 'asset')->where('is_active', true)->orderBy('code')->get();
        $liabilityAccounts = ChartOfAccount::where('type', 'liability')->where('is_active', true)->orderBy('code')->get();
        $equityAccounts = ChartOfAccount::where('type', 'equity')->where('is_active', true)->orderBy('code')->get();

        $reportData = [];
        
        foreach ($months as $month) {
            $asOfDate = $month['date'];
            
            $totalAssets = 0;
            foreach ($assetAccounts as $account) {
                $totalAssets += $this->getAccountBalanceAsOf($account->id, $asOfDate);
            }

            $totalLiabilities = 0;
            foreach ($liabilityAccounts as $account) {
                $totalLiabilities += $this->getAccountBalanceAsOf($account->id, $asOfDate);
            }

            $totalEquity = 0;
            foreach ($equityAccounts as $account) {
                $totalEquity += $this->getAccountBalanceAsOf($account->id, $asOfDate);
            }

            // Calculate net profit/loss from beginning of year to as of date
            $yearStart = Carbon::parse($asOfDate)->startOfYear()->format('Y-m-d');
            $netProfit = $this->calculateNetProfit($yearStart, $asOfDate);
            $totalEquity += $netProfit;

            $reportData[] = [
                'month' => $month['name'],
                'total_assets' => $totalAssets,
                'total_liabilities' => $totalLiabilities,
                'total_equity' => $totalEquity,
                'net_profit' => $netProfit,
            ];
        }

        return Inertia::render('reports/monthly-balance-sheet/index', [
            'year' => $year,
            'reportData' => $reportData,
            'availableYears' => $this->getAvailableYears(),
        ]);
    }

    /**
     * Print monthly balance sheet report
     */
    public function print(Request $request)
    {
        $year = $request->get('year', now()->year);
        
        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $date = Carbon::createFromDate($year, $m, 1)->endOfMonth();
            $months[] = [
                'name' => $date->translatedFormat('F'),
                'date' => $date->format('Y-m-d'),
                'month' => $m,
            ];
        }

        // Get account categories
        $assetAccounts = ChartOfAccount::where('type', 'asset')->where('is_active', true)->orderBy('code')->get();
        $liabilityAccounts = ChartOfAccount::where('type', 'liability')->where('is_active', true)->orderBy('code')->get();
        $equityAccounts = ChartOfAccount::where('type', 'equity')->where('is_active', true)->orderBy('code')->get();

        $reportData = [];
        foreach ($months as $month) {
            $asOfDate = $month['date'];
            
            $totalAssets = 0;
            foreach ($assetAccounts as $account) {
                $totalAssets += $this->getAccountBalanceAsOf($account->id, $asOfDate);
            }

            $totalLiabilities = 0;
            foreach ($liabilityAccounts as $account) {
                $totalLiabilities += $this->getAccountBalanceAsOf($account->id, $asOfDate);
            }

            $totalEquity = 0;
            foreach ($equityAccounts as $account) {
                $totalEquity += $this->getAccountBalanceAsOf($account->id, $asOfDate);
            }

            $yearStart = Carbon::parse($asOfDate)->startOfYear()->format('Y-m-d');
            $netProfit = $this->calculateNetProfit($yearStart, $asOfDate);
            $totalEquity += $netProfit;

            $reportData[] = [
                'month' => $month['name'],
                'total_assets' => $totalAssets,
                'total_liabilities' => $totalLiabilities,
                'total_equity' => $totalEquity,
                'net_profit' => $netProfit,
            ];
        }

        $pdf = Pdf::loadView('pdf.reports.monthly-balance-sheet', [
            'title' => 'Laporan Neraca Bulanan',
            'year' => $year,
            'reportData' => $reportData,
        ])->setPaper('a4', 'landscape');

        return $pdf->download('laporan-neraca-bulanan-' . $year . '.pdf');
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
