<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBankRequest;
use App\Http\Requests\UpdateBankRequest;
use App\Models\Bank;
use App\Models\ChartOfAccount;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class BankController extends Controller
{
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
        $data = $request->validated();

        // Auto-assign chart_of_account_id based on type
        if (!isset($data['chart_of_account_id'])) {
            // Use child accounts: 1101 for cash, 1103 for bank (default)
            $coaCode = $data['type'] === 'cash' ? '1101' : '1103';
            $coa = ChartOfAccount::where('code', $coaCode)->first();
            if ($coa) {
                $data['chart_of_account_id'] = $coa->id;
            }
        }

        Bank::create($data);

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
        $data = $request->validated();

        // Auto-assign chart_of_account_id based on type if not provided
        if (!isset($data['chart_of_account_id'])) {
            // Use child accounts: 1101 for cash, 1103 for bank (default)
            $coaCode = $data['type'] === 'cash' ? '1101' : '1103';
            $coa = ChartOfAccount::where('code', $coaCode)->first();
            if ($coa) {
                $data['chart_of_account_id'] = $coa->id;
            }
        }

        $bank->update($data);

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
