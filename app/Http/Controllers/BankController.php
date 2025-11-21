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
    public function index(): Response
    {
        $banks = Bank::with('chartOfAccount')->orderBy('name')->paginate(10);

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
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
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

            $bank = Bank::create($data);

            // Post opening balance to journal if balance > 0
            $balance = (float) ($data['balance'] ?? 0);
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
    public function show(Bank $bank): Response
    {
        // return Inertia::render('master/bank/show', [
        //     'bank' => $bank,
        // ]);
        return response()->noContent();
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Bank $bank): Response
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
