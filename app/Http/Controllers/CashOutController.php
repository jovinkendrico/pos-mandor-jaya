<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCashOutRequest;
use App\Http\Requests\UpdateCashOutRequest;
use App\Models\CashOut;
use App\Models\Bank;
use App\Models\ChartOfAccount;
use App\Services\JournalService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CashOutController extends Controller
{
    public function __construct(private readonly JournalService $journalService) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = CashOut::with(['bank', 'chartOfAccount'])
            ->orderBy('cash_out_date', 'desc')
            ->orderBy('id', 'desc');

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('cash_out_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('bank', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('chartOfAccount', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('cash_out_date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('cash_out_date', '<=', $request->date_to);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by bank
        if ($request->has('bank_id') && $request->bank_id) {
            $query->where('bank_id', $request->bank_id);
        }

        // Filter by reference type
        if ($request->has('reference_type') && $request->reference_type !== 'all') {
            if ($request->reference_type === 'manual') {
                $query->where(function ($q) {
                    $q->whereNull('reference_type')
                        ->orWhere('reference_type', '');
                });
            } else {
                $query->where('reference_type', $request->reference_type);
            }
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'cash_out_date');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = ['cash_out_date', 'cash_out_number', 'amount', 'status'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('cash_out_date', 'desc');
        }
        $query->orderBy('id', 'desc');

        $cashOuts = $query->paginate(10)->withQueryString();

        // Get banks for filter
        $banks = \App\Models\Bank::orderBy('name')->get(['id', 'name']);

        return Inertia::render('transaction/cash-out/index', [
            'cashOuts' => $cashOuts,
            'banks' => $banks,
            'filters' => [
                'search' => $request->get('search', ''),
                'date_from' => $request->get('date_from', ''),
                'date_to' => $request->get('date_to', ''),
                'status' => $request->get('status', 'all'),
                'bank_id' => $request->get('bank_id', ''),
                'reference_type' => $request->get('reference_type', 'all'),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $banks = Bank::orderBy('name')->get();
        // Get expense accounts (type = 'expense' or 'biaya')
        $expenseAccounts = ChartOfAccount::whereIn('type', ['expense', 'biaya', 'pengeluaran'])
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        return Inertia::render('transaction/cash-out/create', [
            'banks' => $banks,
            'expenseAccounts' => $expenseAccounts,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCashOutRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            // Generate cash out number with retry logic to handle race conditions
            $maxRetries = 5;
            $cashOut = null;

            for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
                try {
                    $cashOutNumber = CashOut::generateCashOutNumber();

                    $cashOut = CashOut::create([
                        'cash_out_number' => $cashOutNumber,
                        'cash_out_date' => $request->cash_out_date,
                        'bank_id' => $request->bank_id,
                        'chart_of_account_id' => $request->chart_of_account_id,
                        'amount' => $request->amount,
                        'description' => $request->description,
                        'status' => $request->auto_post ? 'posted' : 'draft',
                        'reference_type' => 'Manual',
                    ]);

                    break; // Success, exit retry loop
                } catch (\Illuminate\Database\QueryException $e) {
                    // Check if it's a unique constraint violation (SQLSTATE 23000)
                    if ($e->getCode() == 23000 && (str_contains($e->getMessage(), 'cash_out_number') || str_contains($e->getMessage(), 'cash_outs_cash_out_number_unique'))) {
                        if ($attempt === $maxRetries - 1) {
                            throw $e; // Re-throw on last attempt
                        }
                        // Wait a tiny bit before retrying (microseconds)
                        usleep(10000 * ($attempt + 1)); // 10ms, 20ms, 30ms, etc.
                        continue;
                    }
                    throw $e; // Re-throw if it's a different error
                }
            }

            // Auto post to journal if requested
            if ($request->auto_post) {
                $this->journalService->postCashOut($cashOut);
            }
        });

        return redirect()->route('cash-outs.index')
            ->with('success', 'Kas keluar berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(CashOut $cashOut): Response
    {
        $cashOut->loadMissing(['bank', 'chartOfAccount']);

        return Inertia::render('transaction/cash-out/show', [
            'cashOut' => $cashOut,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(CashOut $cashOut): \Illuminate\Http\RedirectResponse|Response
    {
        if ($cashOut->status === 'posted') {
            return redirect()->route('cash-outs.show', $cashOut)
                ->with('error', 'Kas keluar yang sudah diposting tidak dapat diedit.');
        }

        $banks = Bank::orderBy('name')->get();
        $expenseAccounts = ChartOfAccount::whereIn('type', ['expense', 'biaya', 'pengeluaran'])
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        return Inertia::render('transaction/cash-out/edit', [
            'cashOut' => $cashOut,
            'banks' => $banks,
            'expenseAccounts' => $expenseAccounts,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCashOutRequest $request, CashOut $cashOut): RedirectResponse
    {
        if ($cashOut->status === 'posted') {
            return redirect()->route('cash-outs.show', $cashOut)
                ->with('error', 'Kas keluar yang sudah diposting tidak dapat diedit.');
        }

        DB::transaction(function () use ($request, $cashOut) {
            $updateData = array(
                'cash_out_date' => $request->cash_out_date,
                'bank_id' => $request->bank_id,
                'chart_of_account_id' => $request->chart_of_account_id,
                'amount' => $request->amount,
                'description' => $request->description,
            );
            $cashOut->update($updateData);

            // Auto post if requested
            if ($request->auto_post && $cashOut->status === 'draft') {
                $this->journalService->postCashOut($cashOut);
            }
        });

        return redirect()->route('cash-outs.index')
            ->with('success', 'Kas keluar berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CashOut $cashOut): RedirectResponse
    {
        if ($cashOut->status === 'posted') {
            return redirect()->route('cash-outs.show', $cashOut)
                ->with('error', 'Kas keluar yang sudah diposting tidak dapat dihapus. Silakan reverse terlebih dahulu.');
        }

        $cashOut->delete();

        return redirect()->route('cash-outs.index')
            ->with('success', 'Kas keluar berhasil dihapus.');
    }

    /**
     * Post cash out to journal
     */
    public function post(CashOut $cashOut): RedirectResponse
    {
        if ($cashOut->status === 'posted') {
            return redirect()->route('cash-outs.show', $cashOut)
                ->with('error', 'Kas keluar sudah diposting.');
        }

        try {
            $this->journalService->postCashOut($cashOut);
            return redirect()->route('cash-outs.show', $cashOut)
                ->with('success', 'Kas keluar berhasil diposting ke jurnal.');
        } catch (\Exception $e) {
            return redirect()->route('cash-outs.show', $cashOut)
                ->with('error', 'Gagal memposting: ' . $e->getMessage());
        }
    }

    /**
     * Reverse posted cash out
     */
    public function reverse(CashOut $cashOut): RedirectResponse
    {
        if ($cashOut->status !== 'posted') {
            return redirect()->route('cash-outs.show', $cashOut)
                ->with('error', 'Hanya kas keluar yang sudah diposting yang dapat di-reverse.');
        }

        try {
            $this->journalService->reverseCashOut($cashOut);
            return redirect()->route('cash-outs.show', $cashOut)
                ->with('success', 'Kas keluar berhasil di-reverse.');
        } catch (\Exception $e) {
            return redirect()->route('cash-outs.show', $cashOut)
                ->with('error', 'Gagal reverse: ' . $e->getMessage());
        }
    }
}
