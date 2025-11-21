<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreChartOfAccountRequest;
use App\Http\Requests\UpdateChartOfAccountRequest;
use App\Models\ChartOfAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChartOfAccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = ChartOfAccount::query();

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by type
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filter by is_active
        if ($request->has('is_active') && $request->is_active !== 'all') {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by parent_id (null for root accounts)
        if ($request->has('parent_id') && $request->parent_id !== 'all') {
            if ($request->parent_id === 'null' || $request->parent_id === null) {
                $query->whereNull('parent_id');
            } else {
                $query->where('parent_id', $request->parent_id);
            }
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'code');
        $sortOrder = $request->get('sort_order', 'asc');

        $allowedSortFields = ['code', 'name', 'type'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('code', 'asc');
        }
        $query->orderBy('id', 'asc');

        $chartOfAccounts = $query->with('parent')
            ->paginate(10)
            ->withQueryString();

        // Get all accounts for parent selection (for form dropdown)
        $allAccounts = ChartOfAccount::where('is_active', true)
            ->orderBy('type')
            ->orderBy('code')
            ->get();

        return Inertia::render('master/chart-of-account/index', [
            'chartOfAccounts' => $chartOfAccounts,
            'allAccounts' => $allAccounts,
            'filters' => [
                'search' => $request->get('search', ''),
                'type' => $request->get('type', 'all'),
                'is_active' => $request->get('is_active', 'all'),
                'parent_id' => $request->get('parent_id', 'all'),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): RedirectResponse
    {
        return redirect()->route('chart-of-accounts.index');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreChartOfAccountRequest $request): RedirectResponse
    {
        ChartOfAccount::create([
            'code' => $request->code,
            'name' => $request->name,
            'type' => $request->type,
            'parent_id' => $request->parent_id,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('chart-of-accounts.index')
            ->with('success', 'Chart of Account berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(ChartOfAccount $chartOfAccount): RedirectResponse
    {
        return redirect()->route('chart-of-accounts.index');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ChartOfAccount $chartOfAccount): RedirectResponse
    {
        return redirect()->route('chart-of-accounts.index');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateChartOfAccountRequest $request, ChartOfAccount $chartOfAccount): RedirectResponse
    {
        $chartOfAccount->update([
            'code' => $request->code,
            'name' => $request->name,
            'type' => $request->type,
            'parent_id' => $request->parent_id,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('chart-of-accounts.index')
            ->with('success', 'Chart of Account berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ChartOfAccount $chartOfAccount): RedirectResponse
    {
        // Check if account has children
        if ($chartOfAccount->children()->count() > 0) {
            return redirect()->route('chart-of-accounts.index')
                ->with('error', 'Tidak dapat menghapus akun yang memiliki sub-akun.');
        }

        // Check if account has journal entries
        if ($chartOfAccount->journalEntryDetails()->count() > 0) {
            return redirect()->route('chart-of-accounts.index')
                ->with('error', 'Tidak dapat menghapus akun yang sudah memiliki transaksi.');
        }

        $chartOfAccount->delete();

        return redirect()->route('chart-of-accounts.index')
            ->with('success', 'Chart of Account berhasil dihapus.');
    }
}
