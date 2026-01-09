<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBankRequest;
use App\Http\Requests\UpdateBankRequest;
use App\Models\Bank;
use App\Models\ChartOfAccount;
use App\Services\JournalService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class BankController extends Controller
{
    public function __construct(private readonly JournalService $journalService) {}

    /**
     * Display a listing of the resource.
     */
    public function index(\Illuminate\Http\Request $request): Response
    {
        $query = Bank::with('chartOfAccount');

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('account_number', 'like', "%{$search}%")
                    ->orWhere('account_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('chartOfAccount', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by type
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'asc');

        $allowedSortFields = ['name', 'balance', 'type'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('id', 'asc');
        }
        $query->orderBy('id', 'asc');

        $banks = $query->paginate(10)->withQueryString();

        // Get COA accounts for cash/bank (children of 1100 - Kas)
        $kasParent = ChartOfAccount::where('code', '1100')->first();
        $cashBankAccounts = ChartOfAccount::where(function ($query) use ($kasParent) {
            $query->where('parent_id', $kasParent?->id)
                ->orWhere('code', '1100');
        })
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        return Inertia::render('master/bank/index', [
            'banks' => $banks,
            'chartOfAccounts' => $cashBankAccounts,
            'filters' => [
                'search' => $request->get('search', ''),
                'type' => $request->get('type', 'all'),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): \Illuminate\Http\Response
    {
       return response()->noContent();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBankRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $data = $request->validated();

            // Auto-assign chart_of_account_id based on type only if not provided by user
            if (empty($data['chart_of_account_id'])) {
                // Use child accounts: 1101 for cash, 1103 for bank (default)
                $coaCode = $data['type'] === 'cash' ? '1101' : '1103';
                $coa = ChartOfAccount::where('code', $coaCode)->first();
                if ($coa) {
                    $data['chart_of_account_id'] = $coa->id;
                }
            }

            // Set initial_balance = balance when creating new bank
            $balance = (float) ($data['balance'] ?? 0);
            $data['initial_balance'] = $balance;

            $bank = Bank::create($data);

            // Post opening balance to journal if balance > 0
            if ($balance > 0 && $bank->chart_of_account_id) {
                $this->journalService->postBankOpeningBalance($bank, 0);
            }
        });

        return redirect()->route('banks.index')
            ->with('success', 'Bank/Cash berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Bank $bank): \Illuminate\Http\Response
    {
        // return Inertia::render('master/bank/show', [
        //     'bank' => $bank,
        // ]);
        return response()->noContent();
    }

    /**
     * Display cash movement history for a bank.
     */
    public function cashMovement(\Illuminate\Http\Request $request, Bank $bank): Response
    {
        // Query cash movements from the table
        $query = \App\Models\CashMovement::where('bank_id', $bank->id);

        // Filter by date range if provided
        if ($request->has('date_from') && $request->date_from) {
            $query->where('movement_date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->where('movement_date', '<=', $request->date_to);
        }

        // Get opening balance (balance before the filter date)
        $openingBalance = (float) ($bank->initial_balance ?? 0);
        if ($request->has('date_from') && $request->date_from) {
            $lastMovementBefore = \App\Models\CashMovement::where('bank_id', $bank->id)
                ->where('movement_date', '<', $request->date_from)
                ->orderBy('movement_date', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            if ($lastMovementBefore) {
                $openingBalance = (float) $lastMovementBefore->balance;
            }
        }

        // Get closing balance (last movement in the filtered range)
        $closingBalance = $openingBalance;
        $lastMovementInRange = (clone $query)
            ->orderBy('movement_date', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        if ($lastMovementInRange) {
            $closingBalance = (float) $lastMovementInRange->balance;
        }

        // Get transactions with pagination
        // Sort by ID DESC as requested (Latest created first)
        $transactions = $query
            ->orderBy('id', 'desc')
            ->paginate(50)
            ->withQueryString()
            ->through(function ($movement) {
                
                $balanceAfter = (float) $movement->balance;
                $debit = (float) $movement->debit;
                $credit = (float) $movement->credit;
                
                // Calculate balance before: Balance After - Debit + Credit
                // This formula holds true for all standard transactions.
                // For 'Bank' type (Initial Balance), balance is set directly to debit (or -credit).
                // So expected balance_before is 0.
                
                $balanceBefore = $balanceAfter - $debit + $credit;
                // Fix floating point precision issues if close to 0
                if (abs($balanceBefore) < 0.001) $balanceBefore = 0;

                // Get reference number based on reference type
                $referenceNumber = '-';
                if ($movement->reference_type && $movement->reference_id) {
                    switch ($movement->reference_type) {
                        case 'CashIn':
                            $ref = \App\Models\CashIn::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->cash_in_number : '-';
                            break;
                        case 'CashOut':
                            $ref = \App\Models\CashOut::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->cash_out_number : '-';
                            break;
                        case 'SalePayment':
                            $ref = \App\Models\SalePayment::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->payment_number : '-';
                            break;
                        case 'PurchasePayment':
                            $ref = \App\Models\PurchasePayment::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->payment_number : '-';
                            break;
                        case 'SaleReturn':
                            $ref = \App\Models\SaleReturn::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->return_number : '-';
                            break;
                        case 'PurchaseReturn':
                            $ref = \App\Models\PurchaseReturn::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->return_number : '-';
                            break;
                        case 'Bank': // Transfer between banks? or Opening Balance
                            // Check if it's Transfer
                            /* Actually Bank reference seems to be Opening Balance logic in postBankOpeningBalance */
                            $referenceNumber = 'Saldo Awal';
                            break;
                        case 'App\Models\Transfer': // Handle Full Class Name
                        case 'Transfer':
                            $ref = \App\Models\Transfer::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->transfer_number : '-';
                            break;
                    }
                }

                // Handle polymorphic type string cleanup
                $typeStr = $movement->reference_type;
                if ($typeStr === 'App\Models\Transfer') $typeStr = 'Transfer';
                
                return [
                    'id' => $movement->id,
                    'date' => $movement->movement_date->format('Y-m-d'),
                    'type' => $typeStr ? strtolower(str_replace(['Sale', 'Purchase', 'App\\Models\\'], '', $typeStr)) : 'other',
                    'reference_number' => $referenceNumber,
                    'reference_type' => $movement->reference_type,
                    'description' => $movement->description,
                    'debit' => $debit,
                    'credit' => $credit,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                ];
            });

        return Inertia::render('master/bank/cash-movement', [
            'bank' => $bank,
            'transactions' => $transactions,
            'openingBalance' => $openingBalance,
            'closingBalance' => $closingBalance,
            'filters' => [
                'date_from' => $request->get('date_from', ''),
                'date_to' => $request->get('date_to', ''),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Bank $bank): \Illuminate\Http\Response
    {
        // return Inertia::render('master/bank/edit', [
        //     'bank' => $bank,
        // ]);
        return response()->noContent();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBankRequest $request, Bank $bank): RedirectResponse
    {
        DB::transaction(function () use ($request, $bank) {
            $data = $request->validated();

            // Store old balance for comparison
            $oldBalance = (float) $bank->balance;

            // Auto-assign chart_of_account_id based on type only if not provided by user
            if (empty($data['chart_of_account_id'])) {
                // Use child accounts: 1101 for cash, 1103 for bank (default)
                $coaCode = $data['type'] === 'cash' ? '1101' : '1103';
                $coa = ChartOfAccount::where('code', $coaCode)->first();
                if ($coa) {
                    $data['chart_of_account_id'] = $coa->id;
                }
            }

            $bank->update($data);

            // Post balance adjustment to journal if balance changed
            $newBalance = (float) ($data['balance'] ?? 0);
            if (abs($newBalance - $oldBalance) > 0.01 && $bank->chart_of_account_id) {
                $this->journalService->postBankOpeningBalance($bank, $oldBalance);
            }
        });

        return redirect()->route('banks.index')
            ->with('success', 'Bank/Cash berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Bank $bank): RedirectResponse
    {
        $bank->delete();

        return redirect()->route('banks.index')
            ->with('success', 'Bank/Cash berhasil dihapus.');
    }
}
