<?php

namespace App\Http\Controllers;

use App\Models\JournalEntry;
use App\Services\JournalService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class JournalEntryController extends Controller
{
    protected $journalService;

    public function __construct(JournalService $journalService)
    {
        $this->journalService = $journalService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = JournalEntry::with(['details.chartOfAccount'])
            ->orderBy('id', 'desc');

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('journal_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('reference_type', 'like', "%{$search}%");
            });
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('journal_date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('journal_date', '<=', $request->date_to);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by reference type
        if ($request->has('reference_type') && $request->reference_type !== 'all') {
            $query->where('reference_type', $request->reference_type);
        }

        $journalEntries = $query->paginate(10)->withQueryString();

        // Append totals
        $journalEntries->getCollection()->transform(function ($entry) {
            $entry->total_debit = $entry->total_debit;
            $entry->total_credit = $entry->total_credit;
            return $entry;
        });

        return Inertia::render('accounting/journal-entry/index', [
            'journalEntries' => $journalEntries,
            'filters' => [
                'search' => $request->get('search', ''),
                'date_from' => $request->get('date_from', ''),
                'date_to' => $request->get('date_to', ''),
                'status' => $request->get('status', 'all'),
                'reference_type' => $request->get('reference_type', 'all'),
            ],
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(JournalEntry $journalEntry): Response
    {
        $journalEntry->loadMissing(['details.chartOfAccount', 'reversedBy']);

        // Calculate totals from details
        $totalDebit = $journalEntry->details->sum('debit');
        $totalCredit = $journalEntry->details->sum('credit');

        // Append totals to the journal entry
        $journalEntry->setAttribute('total_debit', $totalDebit);
        $journalEntry->setAttribute('total_credit', $totalCredit);

        return Inertia::render('accounting/journal-entry/show', [
            'journalEntry' => $journalEntry,
        ]);
    }

    /**
     * Reverse the specified journal entry.
     */
    public function reverse(JournalEntry $journalEntry): \Illuminate\Http\RedirectResponse
    {
        // Only allow reversing if journal is posted and not already reversed
        if ($journalEntry->status !== 'posted') {
            return redirect()->back()->with('error', 'Hanya jurnal dengan status Posted yang dapat dibalik.');
        }

        try {
            $this->journalService->reverseJournalEntry($journalEntry);
            return redirect()->back()->with('success', 'Jurnal berhasil dibalik.');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Gagal membalikkan jurnal: ' . $e->getMessage()]);
        }
    }
}
