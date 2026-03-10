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
        $vehicleId = $request->get('vehicle_id');

        // Get all active accounts
        $accounts = ChartOfAccount::where('is_active', true)
            ->orderBy('code')
            ->get();

        // Get all vehicles for filter
        $vehicles = \App\Models\Vehicle::orderBy('police_number')->get();

        $ledgerData = [];

        if ($accountId) {
            // Get specific account ledger
            $account = ChartOfAccount::find($accountId);
            if ($account) {
                $ledgerData = $this->getAccountLedger($account, $dateFrom, $dateTo, $vehicleId);
            }
        } else {
            // Get all accounts with their balances
            foreach ($accounts as $account) {
                $balance = $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'both', $vehicleId);
                if ($balance != 0 || $this->hasTransactions($account->id, $dateFrom, $dateTo, $vehicleId)) {
                    $ledgerData[] = [
                        'account' => $account,
                        'opening_balance' => $this->getOpeningBalance($account->id, $dateFrom, $vehicleId),
                        'debit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'debit', $vehicleId),
                        'credit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'credit', $vehicleId),
                        'closing_balance' => $this->getClosingBalance($account->id, $dateFrom, $dateTo, $vehicleId),
                    ];
                }
            }
        }

        return Inertia::render('accounting/general-ledger/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'accountId' => $accountId,
            'vehicleId' => $vehicleId,
            'accounts' => $accounts,
            'vehicles' => $vehicles,
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
        $vehicleId = $request->get('vehicle_id');

        $ledgerData = $this->getAccountLedger($account, $dateFrom, $dateTo, $vehicleId);
        $vehicles = \App\Models\Vehicle::orderBy('police_number')->get();

        $groupedLedgerData = [];
        if (!$vehicleId) {
            // Get data for each vehicle that has activity or balance
            foreach ($vehicles as $v) {
                $vLedger = $this->getAccountLedger($account, $dateFrom, $dateTo, $v->id);
                if (count($vLedger['transactions']) > 0 || $vLedger['opening_balance'] != 0) {
                    $vLedger['vehicle'] = $v;
                    $groupedLedgerData[] = $vLedger;
                }
            }

            // Also check for entries with NO vehicle
            $noVehicleLedger = $this->getAccountLedger($account, $dateFrom, $dateTo, -1); // -1 for No Vehicle
            if (count($noVehicleLedger['transactions']) > 0 || $noVehicleLedger['opening_balance'] != 0) {
                $noVehicleLedger['vehicle'] = ['id' => 0, 'police_number' => 'None'];
                $groupedLedgerData[] = $noVehicleLedger;
            }
        }

        return Inertia::render('accounting/general-ledger/show', [
            'account' => $account,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'vehicleId' => $vehicleId,
            'ledgerData' => $ledgerData,
            'groupedLedgerData' => $groupedLedgerData,
            'vehicles' => $vehicles,
        ]);
    }

    /**
     * Get account ledger with transaction details
     */
    private function getAccountLedger(ChartOfAccount $account, string $dateFrom, string $dateTo, ?int $vehicleId = null): array
    {
        $openingBalance = $this->getOpeningBalance($account->id, $dateFrom, $vehicleId);

        $query = JournalEntryDetail::with(['journalEntry.reference', 'vehicle'])
            ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entry_details.chart_of_account_id', $account->id)
            ->where('journal_entries.status', 'posted')
            ->whereNull('journal_entries.deleted_at')
            ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
            ->whereDate('journal_entries.journal_date', '<=', $dateTo);

        if ($vehicleId === -1) {
            $query->whereNull('journal_entry_details.vehicle_id');
        } elseif ($vehicleId) {
            $query->where('journal_entry_details.vehicle_id', $vehicleId);
        }

        $transactions = $query->orderBy('journal_entries.journal_date')
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

            // Enhanced description with source and vehicle
            $description = $transaction->description ?: $transaction->journal_description;

            // Use source description if available (from CashIn/CashOut)
            if ($transaction->journalEntry && $transaction->journalEntry->reference && isset($transaction->journalEntry->reference->description)) {
                $description = $transaction->journalEntry->reference->description;
            }
            
            // Add source info if available in journal entry
            if ($transaction->journalEntry->reference_type === 'CashIn') {
                $description .= ' (Kas Masuk)';
            } elseif ($transaction->journalEntry->reference_type === 'CashOut') {
                $description .= ' (Kas Keluar)';
            }

            $transactionDetails[] = [
                'date' => $transaction->journal_date,
                'journal_number' => $transaction->journal_number,
                'description' => $description,
                'vehicle' => $transaction->vehicle ? $transaction->vehicle->police_number : '-',
                'debit' => $transaction->debit,
                'credit' => $transaction->credit,
                'balance' => $runningBalance,
            ];
        }

        return [
            'account' => $account,
            'opening_balance' => $openingBalance,
            'transactions' => $transactionDetails,
            'debit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'debit', $vehicleId),
            'credit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'credit', $vehicleId),
            'closing_balance' => $runningBalance,
        ];
    }

    /**
     * Get opening balance (before dateFrom)
     */
    private function getOpeningBalance(int $accountId, string $dateFrom, ?int $vehicleId = null): float
    {
        $account = ChartOfAccount::find($accountId);
        if (!$account) {
            return 0;
        }

        $query = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->whereDate('journal_entries.journal_date', '<', $dateFrom);

        if ($vehicleId === -1) {
            $query->whereNull('journal_entry_details.vehicle_id');
        } elseif ($vehicleId) {
            $query->where('journal_entry_details.vehicle_id', $vehicleId);
        }

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
    private function getClosingBalance(int $accountId, string $dateFrom, string $dateTo, ?int $vehicleId = null): float
    {
        $account = ChartOfAccount::find($accountId);
        if (!$account) {
            return 0;
        }

        $openingBalance = $this->getOpeningBalance($accountId, $dateFrom, $vehicleId);
        $debit = $this->getAccountBalance($accountId, $dateFrom, $dateTo, 'debit', $vehicleId);
        $credit = $this->getAccountBalance($accountId, $dateFrom, $dateTo, 'credit', $vehicleId);

        if (in_array($account->type, ['asset', 'expense', 'biaya', 'pengeluaran'])) {
            return $openingBalance + $debit - $credit;
        } else {
            return $openingBalance + $credit - $debit;
        }
    }

    /**
     * Get account balance for a date range
     */
    private function getAccountBalance(int $accountId, string $dateFrom, string $dateTo, string $type = 'both', ?int $vehicleId = null): float
    {
        $query = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entry_details.chart_of_account_id', $accountId)
            ->where('journal_entries.status', 'posted')
            ->whereNull('journal_entries.deleted_at')
            ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
            ->whereDate('journal_entries.journal_date', '<=', $dateTo);

        if ($vehicleId) {
            $query->where('journal_entry_details.vehicle_id', $vehicleId);
        }

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
    private function hasTransactions(int $accountId, string $dateFrom, string $dateTo, ?int $vehicleId = null): bool
    {
        $query = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entry_details.chart_of_account_id', $accountId)
            ->where('journal_entries.status', 'posted')
            ->whereNull('journal_entries.deleted_at')
            ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
            ->whereDate('journal_entries.journal_date', '<=', $dateTo);

        if ($vehicleId) {
            $query->where('journal_entry_details.vehicle_id', $vehicleId);
        }

        return $query->exists();
    }
}
