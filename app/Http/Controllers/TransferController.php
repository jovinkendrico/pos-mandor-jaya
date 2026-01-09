<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\CashIn;
use App\Models\CashOut;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\Transfer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

use App\Services\CashMovementService;

class TransferController extends Controller
{
    protected $cashMovementService;

    public function __construct(CashMovementService $cashMovementService)
    {
        $this->cashMovementService = $cashMovementService;
    }

    /**
     * Display a listing of transfers.
     */
    public function index(Request $request): Response
    {
        $query = Transfer::with(['fromBank', 'toBank', 'creator', 'journalEntry'])
            ->orderBy('transfer_date', 'desc')
            ->orderBy('created_at', 'desc');

        $transfers = $query->paginate(10);

        return Inertia::render('transaction/transfer/index', [
            'transfers' => $transfers,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Get Banks (which includes Cash accounts if type='cash')
        // We filter active banks that have a chart of account linked
        $banks = Bank::whereNotNull('chart_of_account_id')
            ->orderBy('name')
            ->get();

        return Inertia::render('transaction/transfer/create', [
            'banks' => $banks,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'from_bank_id' => 'required|exists:banks,id|different:to_bank_id',
            'to_bank_id' => 'required|exists:banks,id',
            'amount' => 'required|numeric|min:1',
            'description' => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($request) {
                $user = auth()->user();
                $transferNumber = Transfer::generateTransferNumber();
                
                $fromBank = Bank::with('chartOfAccount')->find($request->from_bank_id);
                $toBank = Bank::with('chartOfAccount')->find($request->to_bank_id);
                
                $description = $request->description ?: "Transfer Dana dari {$fromBank->name} ke {$toBank->name}";

                // 1. Create Transfer Header
                $transfer = Transfer::create([
                    'transfer_number' => $transferNumber,
                    'transfer_date' => $request->date,
                    'from_bank_id' => $request->from_bank_id,
                    'to_bank_id' => $request->to_bank_id,
                    'amount' => $request->amount,
                    'description' => $description,
                    'status' => 'posted',
                    'created_by' => $user->id,
                ]);

                // 2. Create Cash Out (Source)
                $cashOutNumber = CashOut::generateCashOutNumber();
                $cashOut = CashOut::create([
                    'cash_out_number' => $cashOutNumber,
                    'cash_out_date' => $request->date,
                    'bank_id' => $request->from_bank_id, // Source Bank
                    'chart_of_account_id' => $toBank->chart_of_account_id, // Target Account (Destination Bank)
                    'amount' => $request->amount,
                    'description' => $description . " (Ref: $transferNumber)",
                    'status' => 'posted', 
                    'reference_type' => Transfer::class,
                    'reference_id' => $transfer->id,
                    'created_by' => $user->id,
                ]);

                // 3. Create Cash In (Destination)
                $cashInNumber = CashIn::generateCashInNumber();
                $cashIn = CashIn::create([
                    'cash_in_number' => $cashInNumber,
                    'cash_in_date' => $request->date,
                    'bank_id' => $request->to_bank_id, // Destination Bank
                    'chart_of_account_id' => $fromBank->chart_of_account_id, // Source Account
                    'amount' => $request->amount,
                    'description' => $description . " (Ref: $transferNumber)",
                    'status' => 'posted',
                    'reference_type' => Transfer::class,
                    'reference_id' => $transfer->id,
                    'created_by' => $user->id,
                ]);
                
                // 4. Record Cash Movements
                // Source Bank (Credit/Out)
                $this->cashMovementService->createMovement(
                    $fromBank,
                    Transfer::class,
                    $transfer->id,
                    $request->date,
                    0,               // Debit
                    $request->amount,// Credit
                    $description
                );

                // Destination Bank (Debit/In)
                $this->cashMovementService->createMovement(
                    $toBank,
                    Transfer::class,
                    $transfer->id,
                    $request->date,
                    $request->amount,// Debit
                    0,               // Credit
                    $description
                );

                // 5. Create Journal Entry (Linked to Transfer)
                $journalNumber = JournalEntry::generateJournalNumber();
                $journal = JournalEntry::create([
                    'journal_number' => $journalNumber,
                    'journal_date' => $request->date,
                    'description' => $description,
                    'status' => 'posted',
                    'reference_type' => Transfer::class,
                    'reference_id' => $transfer->id,
                    'created_by' => $user->id,
                ]);

                // Credit Source Bank (From)
                JournalEntryDetail::create([
                    'journal_entry_id' => $journal->id,
                    'chart_of_account_id' => $fromBank->chart_of_account_id,
                    'debit' => 0,
                    'credit' => $request->amount,
                    'description' => 'Transfer Keluar ke ' . $toBank->name,
                ]);

                // Debit Destination Bank (To)
                JournalEntryDetail::create([
                    'journal_entry_id' => $journal->id,
                    'chart_of_account_id' => $toBank->chart_of_account_id,
                    'debit' => $request->amount,
                    'credit' => 0,
                    'description' => 'Transfer Masuk dari ' . $fromBank->name,
                ]);
            });

            return redirect()->route('transfers.index')->with('success', 'Transfer berhasil disimpan.');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Terjadi kesalahan: ' . $e->getMessage()]);
        }
    }

    /**
     * Cancel the specified transfer (do not delete, just mark as cancelled).
     */
    public function cancel(Transfer $transfer): \Illuminate\Http\RedirectResponse
    {
        // Only allow cancellation if transfer is posted
        if ($transfer->status === 'cancelled') {
            return redirect()->back()->with('error', 'Transfer sudah dibatalkan sebelumnya.');
        }

        try {
            DB::transaction(function () use ($transfer) {
                // 0. Revert Cash Movements (Balances) by creating counter-movements
                $movements = \App\Models\CashMovement::where('reference_type', Transfer::class)
                    ->where('reference_id', $transfer->id)
                    ->get();

                \Log::info('Transfer Cancellation', [
                    'transfer_id' => $transfer->id,
                    'movements_found' => $movements->count(),
                    'reference_type' => Transfer::class
                ]);

                foreach ($movements as $movement) {
                    $this->cashMovementService->reverseMovement($movement);
                }

                // 1. Update associated CashIn and CashOut status to cancelled (DO NOT DELETE)
                $cashIns = CashIn::where('reference_type', Transfer::class)
                    ->where('reference_id', $transfer->id)
                    ->get();
                
                \Log::info('CashIns found', ['count' => $cashIns->count()]);
                
                foreach ($cashIns as $cashIn) {
                    $cashIn->update(['status' => 'cancelled']);
                }

                $cashOuts = CashOut::where('reference_type', Transfer::class)
                    ->where('reference_id', $transfer->id)
                    ->get();
                
                \Log::info('CashOuts found', ['count' => $cashOuts->count()]);
                
                foreach ($cashOuts as $cashOut) {
                    $cashOut->update(['status' => 'cancelled']);
                }

                // 2. Update associated Journal Entry status to cancelled (DO NOT DELETE)
                $journals = JournalEntry::where('reference_type', Transfer::class)
                    ->where('reference_id', $transfer->id)
                    ->get();
                
                \Log::info('Journals found', ['count' => $journals->count()]);
                
                foreach ($journals as $journal) {
                    $journal->update(['status' => 'cancelled']);
                }

                // 3. Update Transfer status to cancelled (DO NOT DELETE)
                $transfer->update(['status' => 'cancelled']);
            });

            return redirect()->back()->with('success', 'Transfer berhasil dibatalkan.');
        } catch (\Exception $e) {
            \Log::error('Transfer cancellation failed', [
                'transfer_id' => $transfer->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['message' => 'Gagal membatalkan transfer: ' . $e->getMessage()]);
        }
    }
}
