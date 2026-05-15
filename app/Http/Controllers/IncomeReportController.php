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

class IncomeReportController extends Controller
{
    /**
     * Display income report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $vehicleId = $request->get('vehicle_id');
        $bankId = $request->get('bank_id');

        // Only get income accounts
        $accounts = ChartOfAccount::where('is_active', true)
            ->where('type', 'income')
            ->orderBy('code')
            ->get();

        // Get all vehicles for filter
        $vehicles = \App\Models\Vehicle::orderBy('police_number')->get();
        
        // Get all banks for filter
        $banks = Bank::orderBy('name')->get();

        $ledgerData = [];

        // Get all income accounts with their balances
        foreach ($accounts as $account) {
            $hasActivity = $this->hasTransactions($account->id, $dateFrom, $dateTo, $vehicleId, $bankId);
            $openingBalance = $this->getOpeningBalance($account->id, $dateFrom, $vehicleId, $bankId);

            if ($openingBalance != 0 || $hasActivity) {
                $ledgerData[] = [
                    'account' => $account,
                    'opening_balance' => $openingBalance,
                    'debit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'debit', $vehicleId, $bankId),
                    'credit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'credit', $vehicleId, $bankId),
                    'closing_balance' => $this->getClosingBalance($account->id, $dateFrom, $dateTo, $vehicleId, $bankId),
                ];
            }
        }

        return Inertia::render('reports/income/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'vehicleId' => $vehicleId,
            'bankId' => $bankId,
            'vehicles' => $vehicles,
            'banks' => $banks,
            'ledgerData' => $ledgerData,
        ]);
    }

    /**
     * Print income report as PDF
     */
    public function print(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $vehicleId = $request->get('vehicle_id');
        $bankId = $request->get('bank_id');

        // Only income accounts
        $accounts = ChartOfAccount::where('is_active', true)
            ->where('type', 'income')
            ->orderBy('code')
            ->get();
        
        $vehicles = \App\Models\Vehicle::orderBy('police_number')->get();
        $banks = Bank::orderBy('name')->get();

        $allLedgerData = [];

        foreach ($accounts as $account) {
            $openingBalance = $this->getOpeningBalance($account->id, $dateFrom, $vehicleId, $bankId);
            $hasActivity = $this->hasTransactions($account->id, $dateFrom, $dateTo, $vehicleId, $bankId);

            if ($openingBalance != 0 || $hasActivity) {
                $accountData = $this->getAccountLedger($account, $dateFrom, $dateTo, $vehicleId, $bankId);
                
                // Filter collections for grouping if specific IDs are provided
                $targetVehicles = $vehicles;
                if ($vehicleId) {
                    $targetVehicles = $vehicles->where('id', $vehicleId);
                }
                $targetBanks = $banks;
                if ($bankId) {
                    $targetBanks = $banks->where('id', $bankId);
                }

                $groupedData = $this->getNestedGroupedLedger($account, $dateFrom, $dateTo, $targetVehicles, $targetBanks, $vehicleId, $bankId);

                $allLedgerData[] = [
                    'account' => $account,
                    'summary' => $accountData,
                    'grouped' => $groupedData,
                ];
            }
        }

        $pdf = Pdf::loadView('pdf.reports.income-report', [
            'title' => 'Laporan Pendapatan',
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'vehicleId' => $vehicleId,
            'bankId' => $bankId,
            'allLedgerData' => $allLedgerData,
        ])->setPaper('a4', 'landscape');

        return $pdf->download('laporan-pendapatan-' . $dateFrom . '-to-' . $dateTo . '.pdf');
    }

    /**
     * Helper to get nested grouped data (Bank > Vehicle)
     */
    private function getNestedGroupedLedger($account, $dateFrom, $dateTo, $vehicles, $banks, $vehicleId = null, $bankId = null)
    {
        $groupedLedgerData = [];

        foreach ($banks as $b) {
            foreach ($vehicles as $v) {
                $vLedger = $this->getAccountLedger($account, $dateFrom, $dateTo, $v->id, $b->id);
                if (count($vLedger['transactions']) > 0 || $vLedger['opening_balance'] != 0) {
                    $vLedger['vehicle'] = $v;
                    $vLedger['bank'] = $b;
                    $groupedLedgerData[] = $vLedger;
                }
            }

            // Also check for entries with NO vehicle under this Bank (if not filtering for a specific vehicle)
            if (!$vehicleId) {
                $noVehicleLedger = $this->getAccountLedger($account, $dateFrom, $dateTo, -1, $b->id);
                if (count($noVehicleLedger['transactions']) > 0 || $noVehicleLedger['opening_balance'] != 0) {
                    $noVehicleLedger['vehicle'] = (object)['id' => 0, 'police_number' => 'None'];
                    $noVehicleLedger['bank'] = $b;
                    $groupedLedgerData[] = $noVehicleLedger;
                }
            }
        }

        // Also check for entries with specific vehicles but NO bank (if not filtering for a specific bank)
        if (!$bankId) {
            foreach ($vehicles as $v) {
                $vLedger = $this->getAccountLedger($account, $dateFrom, $dateTo, $v->id, -1);
                if (count($vLedger['transactions']) > 0 || $vLedger['opening_balance'] != 0) {
                    $vLedger['vehicle'] = $v;
                    $vLedger['bank'] = (object)['id' => 0, 'name' => 'Tanpa Kas'];
                    $groupedLedgerData[] = $vLedger;
                }
            }
        }

        // Final check for entries with NO vehicle AND NO bank (if no filters active)
        if (!$vehicleId && !$bankId) {
            $noVehicleNoBankLedger = $this->getAccountLedger($account, $dateFrom, $dateTo, -1, -1);
            if (count($noVehicleNoBankLedger['transactions']) > 0 || $noVehicleNoBankLedger['opening_balance'] != 0) {
                $noVehicleNoBankLedger['vehicle'] = (object)['id' => 0, 'police_number' => 'None'];
                $noVehicleNoBankLedger['bank'] = (object)['id' => 0, 'name' => 'Tanpa Kas'];
                $groupedLedgerData[] = $noVehicleNoBankLedger;
            }
        }

        return $groupedLedgerData;
    }

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

        // Load Sale details efficiently for the polymorphic reference
        $transactions->load(['journalEntry.reference' => function ($morphTo) {
            $morphTo->morphWith([
                \App\Models\Sale::class => ['details.item', 'details.itemUom.uom'],
            ]);
        }]);

        $runningBalance = $openingBalance;
        $transactionDetails = [];

        foreach ($transactions as $transaction) {
            // Income: Credit increases balance
            $runningBalance += $transaction->credit - $transaction->debit;
            
            $baseDescription = $transaction->description ?: $transaction->journal_description;
            if ($transaction->journalEntry && $transaction->journalEntry->reference && isset($transaction->journalEntry->reference->description)) {
                $baseDescription = $transaction->journalEntry->reference->description;
            }

            // Check for Sale details
            $detailedInfo = "";
            if ($transaction->journalEntry && $transaction->journalEntry->reference_type === 'Sale') {
                $sale = $transaction->journalEntry->reference;
                if ($sale && $sale->details) {
                    $itemStrings = [];
                    foreach ($sale->details as $detail) {
                        $itemName = $detail->item->name ?? 'Item';
                        $qty = number_format($detail->quantity, 0, ',', '.');
                        $uomName = $detail->itemUom->uom->name ?? '';
                        $price = number_format($detail->price, 0, ',', '.');
                        $total = number_format($detail->subtotal, 0, ',', '.');
                        
                        $itemStrings[] = "{$itemName} {$qty} {$uomName} x Rp.{$price} = Rp.{$total}";
                    }
                    $detailedInfo = implode("\n", $itemStrings);
                }
            }

            $baseDescription = $transaction->journal_description ?: $transaction->description;
            $detailedInfo = '';
            
            if ($transaction->journalEntry && $transaction->journalEntry->reference_type === 'App\\Models\\Sale') {
                $sale = $transaction->journalEntry->reference;
                if ($sale) {
                    $customerName = $sale->customer_name ?: 'Umum';
                    $detailedInfo = "Penjualan: {$customerName} ({$sale->sale_number})";
                }
            }

            $description = $baseDescription;
            if ($detailedInfo) {
                $description = $detailedInfo . ($baseDescription ? " ({$baseDescription})" : "");
            }

            // Add dynamic bank and vehicle info to description if not filtering
            if (!$bankId && $transaction->dynamic_bank_name) {
                $description .= ' [' . $transaction->dynamic_bank_name . ']';
            }
            if (!$vehicleId && $transaction->vehicle) {
                $description .= ' (' . $transaction->vehicle->police_number . ')';
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

        $result = [
            'account' => $account,
            'opening_balance' => $openingBalance,
            'transactions' => $transactionDetails,
            'debit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'debit', $vehicleId, $bankId),
            'credit_total' => $this->getAccountBalance($account->id, $dateFrom, $dateTo, 'credit', $vehicleId, $bankId),
            'closing_balance' => $runningBalance,
        ];

        if ($bankId && $bankId !== -1) {
            $result['bank'] = Bank::find($bankId);
        }
        if ($vehicleId && $vehicleId !== -1) {
            $result['vehicle'] = \App\Models\Vehicle::find($vehicleId);
        }

        return $result;
    }

    private function getOpeningBalance(int $accountId, string $dateFrom, ?int $vehicleId = null, ?int $bankId = null): float
    {
        // Per user request, income/expense reports start with 0 balance for the period
        return 0.0;
    }

    private function getClosingBalance(int $accountId, string $dateFrom, string $dateTo, ?int $vehicleId = null, ?int $bankId = null): float
    {
        $openingBalance = $this->getOpeningBalance($accountId, $dateFrom, $vehicleId, $bankId);
        $debit = $this->getAccountBalance($accountId, $dateFrom, $dateTo, 'debit', $vehicleId, $bankId);
        $credit = $this->getAccountBalance($accountId, $dateFrom, $dateTo, 'credit', $vehicleId, $bankId);

        return $openingBalance + $credit - $debit;
    }

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
            return $credit - $debit;
        }
    }

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
