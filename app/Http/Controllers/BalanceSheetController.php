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

class BalanceSheetController extends Controller
{
    /**
     * Display balance sheet report
     */
    public function index(Request $request): Response
    {
        $asOfDate = $request->get('as_of_date', now()->format('Y-m-d'));

        // Get all asset accounts
        $assetAccounts = ChartOfAccount::where('type', 'asset')
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        // Get all liability accounts
        $liabilityAccounts = ChartOfAccount::where('type', 'liability')
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        // Get all equity accounts
        $equityAccounts = ChartOfAccount::where('type', 'equity')
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        // Calculate asset balances
        $totalAssets = 0;
        $assetDetails = [];
        foreach ($assetAccounts as $account) {
            $balance = $this->getAccountBalanceAsOf($account->id, $asOfDate);
            if ($balance != 0) {
                $assetDetails[] = [
                    'code' => $account->code,
                    'name' => $account->name,
                    'balance' => $balance,
                ];
                $totalAssets += $balance;
            }
        }

        // Calculate liability balances
        $totalLiabilities = 0;
        $liabilityDetails = [];
        foreach ($liabilityAccounts as $account) {
            $balance = $this->getAccountBalanceAsOf($account->id, $asOfDate);
            if ($balance != 0) {
                $liabilityDetails[] = [
                    'code' => $account->code,
                    'name' => $account->name,
                    'balance' => $balance,
                ];
                $totalLiabilities += $balance;
            }
        }

        // Calculate equity balances (excluding retained earnings which will be calculated from P&L)
        $totalEquity = 0;
        $equityDetails = [];
        foreach ($equityAccounts as $account) {
            $balance = $this->getAccountBalanceAsOf($account->id, $asOfDate);
            if ($balance != 0) {
                $equityDetails[] = [
                    'code' => $account->code,
                    'name' => $account->name,
                    'balance' => $balance,
                ];
                $totalEquity += $balance;
            }
        }

        // Calculate net profit/loss from beginning of year to as of date
        $yearStart = Carbon::parse($asOfDate)->startOfYear()->format('Y-m-d');
        $netProfit = $this->calculateNetProfit($yearStart, $asOfDate);

        // Add retained earnings (net profit) to equity
        if ($netProfit != 0) {
            $equityDetails[] = [
                'code' => 'L/R',
                'name' => 'Laba/Rugi Tahun Berjalan',
                'balance' => $netProfit,
            ];
            $totalEquity += $netProfit;
        }

        $totalLiabilitiesAndEquity = $totalLiabilities + $totalEquity;

        return Inertia::render('reports/balance-sheet/index', [
            'asOfDate' => $asOfDate,
            'assetDetails' => $assetDetails,
            'liabilityDetails' => $liabilityDetails,
            'equityDetails' => $equityDetails,
            'totalAssets' => $totalAssets,
            'totalLiabilities' => $totalLiabilities,
            'totalEquity' => $totalEquity,
            'totalLiabilitiesAndEquity' => $totalLiabilitiesAndEquity,
            'netProfit' => $netProfit,
        ]);
    }

    /**
     * Print balance sheet report as PDF
     */
    public function print(Request $request)
    {
        try {
            $asOfDate = $request->get('as_of_date', now()->format('Y-m-d'));

            // Get all asset accounts
            $assetAccounts = ChartOfAccount::where('type', 'asset')
                ->where('is_active', true)
                ->orderBy('code')
                ->get();

            // Get all liability accounts
            $liabilityAccounts = ChartOfAccount::where('type', 'liability')
                ->where('is_active', true)
                ->orderBy('code')
                ->get();

            // Get all equity accounts
            $equityAccounts = ChartOfAccount::where('type', 'equity')
                ->where('is_active', true)
                ->orderBy('code')
                ->get();

            // Calculate asset balances
            $totalAssets = 0;
            $assetDetails = [];
            foreach ($assetAccounts as $account) {
                $balance = $this->getAccountBalanceAsOf($account->id, $asOfDate);
                if ($balance != 0) {
                    $assetDetails[] = [
                        'code' => $account->code,
                        'name' => $account->name,
                        'balance' => $balance,
                    ];
                    $totalAssets += $balance;
                }
            }

            // Calculate liability balances
            $totalLiabilities = 0;
            $liabilityDetails = [];
            foreach ($liabilityAccounts as $account) {
                $balance = $this->getAccountBalanceAsOf($account->id, $asOfDate);
                if ($balance != 0) {
                    $liabilityDetails[] = [
                        'code' => $account->code,
                        'name' => $account->name,
                        'balance' => $balance,
                    ];
                    $totalLiabilities += $balance;
                }
            }

            // Calculate equity balances
            $totalEquity = 0;
            $equityDetails = [];
            foreach ($equityAccounts as $account) {
                $balance = $this->getAccountBalanceAsOf($account->id, $asOfDate);
                if ($balance != 0) {
                    $equityDetails[] = [
                        'code' => $account->code,
                        'name' => $account->name,
                        'balance' => $balance,
                    ];
                    $totalEquity += $balance;
                }
            }

            // Calculate net profit/loss
            $yearStart = Carbon::parse($asOfDate)->startOfYear()->format('Y-m-d');
            $netProfit = $this->calculateNetProfit($yearStart, $asOfDate);

            if ($netProfit != 0) {
                $equityDetails[] = [
                    'code' => 'L/R',
                    'name' => 'Laba/Rugi Tahun Berjalan',
                    'balance' => $netProfit,
                ];
                $totalEquity += $netProfit;
            }

            $totalLiabilitiesAndEquity = $totalLiabilities + $totalEquity;

            $pdf = Pdf::loadView('pdf.reports.balance-sheet', [
                'title' => 'Laporan Neraca',
                'asOfDate' => $asOfDate,
                'assetDetails' => $assetDetails,
                'liabilityDetails' => $liabilityDetails,
                'equityDetails' => $equityDetails,
                'totalAssets' => $totalAssets,
                'totalLiabilities' => $totalLiabilities,
                'totalEquity' => $totalEquity,
                'totalLiabilitiesAndEquity' => $totalLiabilitiesAndEquity,
                'netProfit' => $netProfit,
            ])->setPaper('a4', 'portrait');

            $filename = 'laporan-neraca-' . $asOfDate . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Balance Sheet Report - Exception caught', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return back()->withErrors([
                'message' => 'Error generating PDF: ' . $e->getMessage(),
            ]);
        }
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
