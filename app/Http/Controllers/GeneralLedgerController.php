<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\Bank;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;

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
        $bankId = $request->get('bank_id');

        // Get all active accounts
        $accounts = ChartOfAccount::where('is_active', true)
            ->orderBy('code')
            ->get();

        // Get all vehicles for filter
        $vehicles = \App\Models\Vehicle::orderBy('police_number')->get();
        
        // Get all banks for filter
        $banks = Bank::orderBy('name')->get();

        $ledgerData = [];

        if ($accountId) {
            // Get specific account ledger
            $account = ChartOfAccount::find($accountId);
            if ($account) {
                $ledgerData = $this->getAccountLedger($account, $dateFrom, $dateTo, $vehicleId, $bankId);
            }
        } else {
            // Get all accounts with their balances
            foreach ($accounts as $account) {
                $balance = $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'both', $vehicleId, $bankId);
                if ($balance != 0 || $this->hasTransactions($account->id, $dateFrom, $dateTo, $vehicleId, $bankId)) {
                    $ledgerData[] = [
                        'account' => $account,
                        'opening_balance' => $this->getOpeningBalance($account->id, $dateFrom, $vehicleId, $bankId),
                        'debit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'debit', $vehicleId, $bankId),
                        'credit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'credit', $vehicleId, $bankId),
                        'closing_balance' => $this->getClosingBalance($account->id, $dateFrom, $dateTo, $vehicleId, $bankId),
                    ];
                }
            }
        }

        return Inertia::render('accounting/general-ledger/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'accountId' => $accountId,
            'vehicleId' => $vehicleId,
            'bankId' => $bankId,
            'accounts' => $accounts,
            'vehicles' => $vehicles,
            'banks' => $banks,
            'ledgerData' => $ledgerData,
        ]);
    }

    /**
     * Print all accounts ledger as PDF
     */
    public function printAll(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $vehicleId = $request->get('vehicle_id');
        $bankId = $request->get('bank_id');

        // Get all active accounts
        $accounts = ChartOfAccount::where('is_active', true)
            ->orderBy('code')
            ->get();
        
        $vehicles = \App\Models\Vehicle::orderBy('police_number')->get();
        $banks = Bank::orderBy('name')->get();

        $allLedgerData = [];

        foreach ($accounts as $account) {
            // Only include accounts with transactions OR non-zero opening balance
            $openingBalance = $this->getOpeningBalance($account->id, $dateFrom, $vehicleId, $bankId);
            $hasActivity = $this->hasTransactions($account->id, $dateFrom, $dateTo, $vehicleId, $bankId);

            if ($openingBalance != 0 || $hasActivity) {
                $accountData = $this->getAccountLedger($account, $dateFrom, $dateTo, $vehicleId, $bankId);
                
                $groupedData = [];
                if (!$vehicleId && !$bankId) {
                    $groupedData = $this->getNestedGroupedLedger($account, $dateFrom, $dateTo, $vehicles, $banks);
                }

                $allLedgerData[] = [
                    'account' => $account,
                    'summary' => $accountData,
                    'grouped' => $groupedData,
                ];
            }
        }

        $pdf = Pdf::loadView('pdf.reports.general-ledger-all', [
            'title' => 'Buku Besar Lengkap',
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'vehicleId' => $vehicleId,
            'bankId' => $bankId,
            'allLedgerData' => $allLedgerData,
        ])->setPaper('a4', 'landscape');

        return $pdf->download('buku-besar-lengkap-' . $dateFrom . '-to-' . $dateTo . '.pdf');
    }

    /**
     * Print specific account ledger as PDF
     */
    public function printShow(Request $request, ChartOfAccount $account)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $vehicleId = $request->get('vehicle_id');
        $bankId = $request->get('bank_id');

        $ledgerData = $this->getAccountLedger($account, $dateFrom, $dateTo, $vehicleId, $bankId);
        $vehicles = \App\Models\Vehicle::orderBy('police_number')->get();
        $banks = Bank::orderBy('name')->get();

        $groupedLedgerData = [];
        if (!$vehicleId && !$bankId) {
            $groupedLedgerData = $this->getNestedGroupedLedger($account, $dateFrom, $dateTo, $vehicles, $banks);
        }

        $pdf = Pdf::loadView('pdf.reports.general-ledger-detail', [
            'title' => 'Buku Besar - ' . $account->name,
            'account' => $account,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'ledgerData' => $ledgerData,
            'groupedLedgerData' => $groupedLedgerData,
        ])->setPaper('a4', 'landscape');

        return $pdf->download('buku-besar-' . $account->code . '-' . $dateFrom . '-to-' . $dateTo . '.pdf');
    }

    /**
     * Get detailed ledger for a specific account
     */
    public function show(Request $request, ChartOfAccount $account): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $vehicleId = $request->get('vehicle_id');
        $bankId = $request->get('bank_id');

        $ledgerData = $this->getAccountLedger($account, $dateFrom, $dateTo, $vehicleId, $bankId);
        $vehicles = \App\Models\Vehicle::orderBy('police_number')->get();
        $banks = Bank::orderBy('name')->get();

        $groupedLedgerData = [];
        if (!$vehicleId && !$bankId) {
            $groupedLedgerData = $this->getNestedGroupedLedger($account, $dateFrom, $dateTo, $vehicles, $banks);
        }

        return Inertia::render('accounting/general-ledger/show', [
            'account' => $account,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'vehicleId' => $vehicleId,
            'bankId' => $bankId,
            'ledgerData' => $ledgerData,
            'groupedLedgerData' => $groupedLedgerData,
            'vehicles' => $vehicles,
            'banks' => $banks,
        ]);
    }

    /**
     * Helper to get nested grouped data (Bank > Vehicle)
     */
    private function getNestedGroupedLedger($account, $dateFrom, $dateTo, $vehicles, $banks)
    {
        $groupedLedgerData = [];

        // Loop through each Bank
        foreach ($banks as $b) {
            $bankHasData = false;
            
            // Loop through each Vehicle under this Bank
            foreach ($vehicles as $v) {
                $vLedger = $this->getAccountLedger($account, $dateFrom, $dateTo, $v->id, $b->id);
                if (count($vLedger['transactions']) > 0 || $vLedger['opening_balance'] != 0) {
                    $vLedger['vehicle'] = $v;
                    $vLedger['bank'] = $b;
                    $groupedLedgerData[] = $vLedger;
                    $bankHasData = true;
                }
            }

            // Also check for entries with NO vehicle under this Bank
            $noVehicleLedger = $this->getAccountLedger($account, $dateFrom, $dateTo, -1, $b->id);
            if (count($noVehicleLedger['transactions']) > 0 || $noVehicleLedger['opening_balance'] != 0) {
                $noVehicleLedger['vehicle'] = (object)['id' => 0, 'police_number' => 'None'];
                $noVehicleLedger['bank'] = $b;
                $groupedLedgerData[] = $noVehicleLedger;
                $bankHasData = true;
            }
        }

        // Also check for entries with NO bank at all
        foreach ($vehicles as $v) {
            $vLedger = $this->getAccountLedger($account, $dateFrom, $dateTo, $v->id, -1);
            if (count($vLedger['transactions']) > 0 || $vLedger['opening_balance'] != 0) {
                $vLedger['vehicle'] = $v;
                $vLedger['bank'] = (object)['id' => 0, 'name' => 'Tanpa Kas'];
                $groupedLedgerData[] = $vLedger;
            }
        }

        $noVehicleNoBankLedger = $this->getAccountLedger($account, $dateFrom, $dateTo, -1, -1);
        if (count($noVehicleNoBankLedger['transactions']) > 0 || $noVehicleNoBankLedger['opening_balance'] != 0) {
            $noVehicleNoBankLedger['vehicle'] = (object)['id' => 0, 'police_number' => 'None'];
            $noVehicleNoBankLedger['bank'] = (object)['id' => 0, 'name' => 'Tanpa Kas'];
            $groupedLedgerData[] = $noVehicleNoBankLedger;
        }

        return $groupedLedgerData;
    }

    /**
     * Get account ledger with transaction details
     */
    private function getAccountLedger(ChartOfAccount $account, string $dateFrom, string $dateTo, ?int $vehicleId = null, ?int $bankId = null): array
    {
        $openingBalance = $this->getOpeningBalance($account->id, $dateFrom, $vehicleId, $bankId);

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

        if ($bankId === -1) {
            // Find transactions that have NO association with any bank account
            $query->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('journal_entry_details as jed_sub')
                    ->join('banks', 'banks.chart_of_account_id', '=', 'jed_sub.chart_of_account_id')
                    ->whereColumn('jed_sub.journal_entry_id', 'journal_entry_details.journal_entry_id');
            });
        } elseif ($bankId) {
            $bankCoaId = Bank::find($bankId)?->chart_of_account_id;
            if ($bankCoaId) {
                $query->whereExists(function ($q) use ($bankCoaId) {
                    $q->select(DB::raw(1))
                        ->from('journal_entry_details as jed_sub')
                        ->whereColumn('jed_sub.journal_entry_id', 'journal_entry_details.journal_entry_id')
                        ->where('jed_sub.chart_of_account_id', $bankCoaId);
                });
            }
        }

        $transactions = $query->orderBy('journal_entries.journal_date')
            ->orderBy('journal_entries.id')
            ->select(
                'journal_entry_details.*', 
                'journal_entries.journal_number', 
                'journal_entries.journal_date', 
                'journal_entries.description as journal_description',
                DB::raw('(SELECT banks.id FROM journal_entry_details jed2 JOIN banks ON banks.chart_of_account_id = jed2.chart_of_account_id WHERE jed2.journal_entry_id = journal_entry_details.journal_entry_id LIMIT 1) as dynamic_bank_id'),
                DB::raw('(SELECT banks.name FROM journal_entry_details jed2 JOIN banks ON banks.chart_of_account_id = jed2.chart_of_account_id WHERE jed2.journal_entry_id = journal_entry_details.journal_entry_id LIMIT 1) as dynamic_bank_name')
            )
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

            // Add dynamic bank info to description if not filtering by bank
            if (!$bankId && $transaction->dynamic_bank_name) {
                $description .= ' [' . $transaction->dynamic_bank_name . ']';
            }

            $transactionDetails[] = [
                'date' => $transaction->journal_date,
                'journal_number' => $transaction->journal_number,
                'description' => $description,
                'vehicle' => $transaction->vehicle ? $transaction->vehicle->police_number : '-',
                'bank' => $transaction->dynamic_bank_name ?: '-',
                'debit' => $transaction->debit,
                'credit' => $transaction->credit,
                'balance' => $runningBalance,
            ];
        }

        return [
            'account' => $account,
            'opening_balance' => $openingBalance,
            'transactions' => $transactionDetails,
            'debit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'debit', $vehicleId, $bankId),
            'credit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'credit', $vehicleId, $bankId),
            'closing_balance' => $runningBalance,
        ];
    }

    /**
     * Get opening balance (before dateFrom)
     */
    private function getOpeningBalance(int $accountId, string $dateFrom, ?int $vehicleId = null, ?int $bankId = null): float
    {
        $account = ChartOfAccount::find($accountId);
        if (!$account) {
            return 0;
        }

        $query = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entry_details.chart_of_account_id', $accountId)
            ->where('journal_entries.status', 'posted')
            ->whereNull('journal_entries.deleted_at')
            ->whereDate('journal_entries.journal_date', '<', $dateFrom);

        if ($vehicleId === -1) {
            $query->whereNull('journal_entry_details.vehicle_id');
        } elseif ($vehicleId) {
            $query->where('journal_entry_details.vehicle_id', $vehicleId);
        }

        if ($bankId === -1) {
            $query->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('journal_entry_details as jed_sub')
                    ->join('banks', 'banks.chart_of_account_id', '=', 'jed_sub.chart_of_account_id')
                    ->whereColumn('jed_sub.journal_entry_id', 'journal_entry_details.journal_entry_id');
            });
        } elseif ($bankId) {
            $bankCoaId = Bank::find($bankId)?->chart_of_account_id;
            if ($bankCoaId) {
                $query->whereExists(function ($q) use ($bankCoaId) {
                    $q->select(DB::raw(1))
                        ->from('journal_entry_details as jed_sub')
                        ->whereColumn('jed_sub.journal_entry_id', 'journal_entry_details.journal_entry_id')
                        ->where('jed_sub.chart_of_account_id', $bankCoaId);
                });
            }
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
    private function getClosingBalance(int $accountId, string $dateFrom, string $dateTo, ?int $vehicleId = null, ?int $bankId = null): float
    {
        $account = ChartOfAccount::find($accountId);
        if (!$account) {
            return 0;
        }

        $openingBalance = $this->getOpeningBalance($accountId, $dateFrom, $vehicleId, $bankId);
        $debit = $this->getAccountBalance($accountId, $dateFrom, $dateTo, 'debit', $vehicleId, $bankId);
        $credit = $this->getAccountBalance($accountId, $dateFrom, $dateTo, 'credit', $vehicleId, $bankId);

        if (in_array($account->type, ['asset', 'expense', 'biaya', 'pengeluaran'])) {
            return $openingBalance + $debit - $credit;
        } else {
            return $openingBalance + $credit - $debit;
        }
    }

    /**
     * Get account balance for a date range
     */
    private function getAccountBalance(int $accountId, string $dateFrom, string $dateTo, string $type = 'both', ?int $vehicleId = null, ?int $bankId = null): float
    {
        $query = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entry_details.chart_of_account_id', $accountId)
            ->where('journal_entries.status', 'posted')
            ->whereNull('journal_entries.deleted_at')
            ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
            ->whereDate('journal_entries.journal_date', '<=', $dateTo);

        if ($vehicleId === -1) {
            $query->whereNull('journal_entry_details.vehicle_id');
        } elseif ($vehicleId) {
            $query->where('journal_entry_details.vehicle_id', $vehicleId);
        }

        if ($bankId === -1) {
            $query->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('journal_entry_details as jed_sub')
                    ->join('banks', 'banks.chart_of_account_id', '=', 'jed_sub.chart_of_account_id')
                    ->whereColumn('jed_sub.journal_entry_id', 'journal_entry_details.journal_entry_id');
            });
        } elseif ($bankId) {
            $bankCoaId = Bank::find($bankId)?->chart_of_account_id;
            if ($bankCoaId) {
                $query->whereExists(function ($q) use ($bankCoaId) {
                    $q->select(DB::raw(1))
                        ->from('journal_entry_details as jed_sub')
                        ->whereColumn('jed_sub.journal_entry_id', 'journal_entry_details.journal_entry_id')
                        ->where('jed_sub.chart_of_account_id', $bankCoaId);
                });
            }
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
    private function hasTransactions(int $accountId, string $dateFrom, string $dateTo, ?int $vehicleId = null, ?int $bankId = null): bool
    {
        $query = JournalEntryDetail::join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entry_details.chart_of_account_id', $accountId)
            ->where('journal_entries.status', 'posted')
            ->whereNull('journal_entries.deleted_at')
            ->whereDate('journal_entries.journal_date', '>=', $dateFrom)
            ->whereDate('journal_entries.journal_date', '<=', $dateTo);

        if ($vehicleId === -1) {
            $query->whereNull('journal_entry_details.vehicle_id');
        } elseif ($vehicleId) {
            $query->where('journal_entry_details.vehicle_id', $vehicleId);
        }

        if ($bankId === -1) {
            $query->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('journal_entry_details as jed_sub')
                    ->join('banks', 'banks.chart_of_account_id', '=', 'jed_sub.chart_of_account_id')
                    ->whereColumn('jed_sub.journal_entry_id', 'journal_entry_details.journal_entry_id');
            });
        } elseif ($bankId) {
            $bankCoaId = Bank::find($bankId)?->chart_of_account_id;
            if ($bankCoaId) {
                $query->whereExists(function ($q) use ($bankCoaId) {
                    $q->select(DB::raw(1))
                        ->from('journal_entry_details as jed_sub')
                        ->whereColumn('jed_sub.journal_entry_id', 'journal_entry_details.journal_entry_id')
                        ->where('jed_sub.chart_of_account_id', $bankCoaId);
                });
            }
        }

        return $query->exists();
    }
}
