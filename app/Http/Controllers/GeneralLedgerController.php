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

class GeneralLedgerController extends Controller
{
    /**
     * Display general ledger report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $accountId = $request->get('account_id');

        // Get all active accounts
        $accounts = ChartOfAccount::where('is_active', true)
            ->orderBy('code')
            ->get();

        $ledgerData = [];

        if ($accountId) {
            // Get specific account ledger
            $account = ChartOfAccount::find($accountId);
            if ($account) {
                $ledgerData = $this->getAccountLedger($account, $dateFrom, $dateTo);
            }
        } else {
            // Get all accounts with their balances
            foreach ($accounts as $account) {
                $balance = $this->getAccountBalance($account->id, $dateFrom, $dateTo);
                if ($balance != 0 || $this->hasTransactions($account->id, $dateFrom, $dateTo)) {
                    $ledgerData[] = [
                        'account' => $account,
                        'opening_balance' => $this->getOpeningBalance($account->id, $dateFrom),
                        'debit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'debit'),
                        'credit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'credit'),
                        'closing_balance' => $this->getClosingBalance($account->id, $dateFrom, $dateTo),
                    ];
                }
            }
        }

        return Inertia::render('accounting/general-ledger/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'accountId' => $accountId,
            'accounts' => $accounts,
            'ledgerData' => $ledgerData,
        ]);
    }

    /**
     * Get detailed ledger for a specific account
     */
    public function show(Request $request, ChartOfAccount $account): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        $ledgerData = $this->getAccountLedger($account, $dateFrom, $dateTo);

        return Inertia::render('accounting/general-ledger/show', [
            'account' => $account,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'ledgerData' => $ledgerData,
        ]);
    }

    /**
     * Get account ledger with transaction details
     */
    private function getAccountLedger(ChartOfAccount $account, string $dateFrom, string $dateTo): array
    {
        $openingBalance = $this->getOpeningBalance($account->id, $dateFrom);

        $transactions = JournalEntryDetail::with(['journalEntry'])
            ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entry_details.chart_of_account_id', $account->id)
            ->where('journal_entries.status', 'posted')
            ->whereNull('journal_entries.deleted_at')
            ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
            ->whereDate('journal_entries.journal_date', '<=', $dateTo)
            ->orderBy('journal_entries.journal_date')
            ->orderBy('journal_entries.id')
            ->select('journal_entry_details.*', 'journal_entries.journal_number', 'journal_entries.journal_date', 'journal_entries.description as journal_description')
            ->get();

        $runningBalance = $openingBalance;
        $transactionDetails = [];

        foreach ($transactions as $transaction) {
            // Calculate running balance based on account type
            if (in_array($account->type, ['asset', 'expense', 'biaya', 'pengeluaran'])) {
                // Asset and Expense: Debit increases, Credit decreases
                $runningBalance += $transaction->debit - $transaction->credit;
            } else {
                // Liability, Equity, Income: Credit increases, Debit decreases
                $runningBalance += $transaction->credit - $transaction->debit;
            }

            $transactionDetails[] = [
                'date' => $transaction->journal_date,
                'journal_number' => $transaction->journal_number,
                'description' => $transaction->description ?: $transaction->journal_description,
                'debit' => $transaction->debit,
                'credit' => $transaction->credit,
                'balance' => $runningBalance,
            ];
        }

        return [
            'account' => $account,
            'opening_balance' => $openingBalance,
            'transactions' => $transactionDetails,
            'debit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'debit'),
            'credit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'credit'),
            'closing_balance' => $runningBalance,
        ];
    }

    /**
     * Get opening balance (before dateFrom)
     */
    private function getOpeningBalance(int $accountId, string $dateFrom): float
    {
        $account = ChartOfAccount::find($accountId);
        if (!$account) {
            return 0;
        }

        $query = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entry_details.chart_of_account_id', $accountId)
            ->where('journal_entries.status', 'posted')
            ->whereDate('journal_entries.journal_date', '<', $dateFrom);

        $debit = (float) $query->sum('journal_entry_details.debit') ?? 0;
        $credit = (float) $query->sum('journal_entry_details.credit') ?? 0;

        // Calculate balance based on account type
        if (in_array($account->type, ['asset', 'expense', 'biaya', 'pengeluaran'])) {
            return $debit - $credit;
        } else {
            return $credit - $debit;
        }
    }

    /**
     * Get closing balance
     */
    private function getClosingBalance(int $accountId, string $dateFrom, string $dateTo): float
    {
        $account = ChartOfAccount::find($accountId);
        if (!$account) {
            return 0;
        }

        $openingBalance = $this->getOpeningBalance($accountId, $dateFrom);
        $debit = $this->getAccountBalance($accountId, $dateFrom, $dateTo, 'debit');
        $credit = $this->getAccountBalance($accountId, $dateFrom, $dateTo, 'credit');

        if (in_array($account->type, ['asset', 'expense', 'biaya', 'pengeluaran'])) {
            return $openingBalance + $debit - $credit;
        } else {
            return $openingBalance + $credit - $debit;
        }
    }

    /**
     * Get account balance for a date range
     */
    private function getAccountBalance(int $accountId, string $dateFrom, string $dateTo, string $type = 'both'): float
    {
        $query = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entry_details.chart_of_account_id', $accountId)
            ->where('journal_entries.status', 'posted')
            ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
            ->whereDate('journal_entries.journal_date', '<=', $dateTo);

        if ($type === 'debit') {
            return (float) $query->sum('journal_entry_details.debit') ?? 0;
        } elseif ($type === 'credit') {
            return (float) $query->sum('journal_entry_details.credit') ?? 0;
        } else {
            $debit = (float) $query->sum('journal_entry_details.debit') ?? 0;
            $credit = (float) $query->sum('journal_entry_details.credit') ?? 0;
            return $debit - $credit;
        }
    }

    /**
     * Check if account has transactions in date range
     */
    private function hasTransactions(int $accountId, string $dateFrom, string $dateTo): bool
    {
        return JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entry_details.chart_of_account_id', $accountId)
            ->where('journal_entries.status', 'posted')
            ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
            ->whereDate('journal_entries.journal_date', '<=', $dateTo)
            ->exists();
    }
}

