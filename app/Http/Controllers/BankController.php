<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBankRequest;
use App\Http\Requests\UpdateBankRequest;
use App\Models\Bank;
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
        $banks = Bank::orderBy('name')->paginate(10);

        return Inertia::render('Master/Bank/Index', [
            'banks' => $banks,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Master/Bank/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBankRequest $request): RedirectResponse
    {
        Bank::create($request->validated());

        return redirect()->route('banks.index')
            ->with('success', 'Bank/Cash berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Bank $bank): Response
    {
        return Inertia::render('Master/Bank/Show', [
            'bank' => $bank,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Bank $bank): Response
    {
        return Inertia::render('Master/Bank/Edit', [
            'bank' => $bank,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBankRequest $request, Bank $bank): RedirectResponse
    {
        $bank->update($request->validated());

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
