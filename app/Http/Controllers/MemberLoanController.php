<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Bank;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\MemberLoan;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class MemberLoanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = MemberLoan::with(['member', 'bank', 'creator']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('loan_number', 'like', "%{$search}%")
                    ->orWhereHas('member', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('member_id')) {
            $query->where('member_id', $request->member_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('loan_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('loan_date', '<=', $request->date_to);
        }

        $query->orderByRaw('CAST(SUBSTRING(loan_number, 3) AS UNSIGNED) DESC');

        $loans = $query->paginate(15)->withQueryString();

        // Append computed attributes
        $loans->getCollection()->each->append(['total_paid', 'remaining_amount']);

        $members = Member::orderBy('name')->get(['id', 'name']);

        return Inertia::render('transaction/member-loan/index', [
            'loans'   => $loans,
            'members' => $members,
            'filters' => [
                'search'    => $request->get('search', ''),
                'status'    => $request->get('status', 'all'),
                'member_id' => $request->get('member_id', ''),
                'date_from' => $request->get('date_from', ''),
                'date_to'   => $request->get('date_to', ''),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $members = Member::orderBy('name')->get(['id', 'name']);
        $banks   = Bank::orderBy('name')->get(['id', 'name']);

        return Inertia::render('transaction/member-loan/create', [
            'members' => $members,
            'banks'   => $banks,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'member_id'  => ['required', 'exists:members,id'],
            'loan_date'  => ['required', 'date'],
            'amount'     => ['required', 'numeric', 'min:1'],
            'bank_id'    => ['nullable', 'exists:banks,id'],
            'notes'      => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request) {
            $maxRetries = 5;
            for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
                try {
                    $loanNumber = MemberLoan::generateLoanNumber();
                    MemberLoan::create([
                        'loan_number'        => $loanNumber,
                        'member_id'          => $request->member_id,
                        'loan_date'          => $request->loan_date,
                        'amount'             => $request->amount,
                        'bank_id'            => $request->bank_id,
                        'notes'              => $request->notes,
                        'status'             => 'pending',
                        'is_opening_balance' => false,
                        'created_by'         => auth()->id(),
                        'updated_by'         => auth()->id(),
                    ]);
                    break;
                } catch (\Illuminate\Database\QueryException $e) {
                    if ($e->getCode() == 23000 && str_contains($e->getMessage(), 'loan_number')) {
                        if ($attempt === $maxRetries - 1) throw $e;
                        usleep(10000 * ($attempt + 1));
                        continue;
                    }
                    throw $e;
                }
            }
        });

        return redirect()->route('member-loans.index')
            ->with('success', 'Pinjaman berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(MemberLoan $memberLoan): Response
    {
        $memberLoan->load(['member', 'bank', 'payments.bank', 'creator', 'updater']);
        $memberLoan->append(['total_paid', 'remaining_amount']);

        $banks = Bank::orderBy('name')->get(['id', 'name']);

        return Inertia::render('transaction/member-loan/show', [
            'loan'  => $memberLoan,
            'banks' => $banks,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MemberLoan $memberLoan): Response|RedirectResponse
    {
        if ($memberLoan->status === 'confirmed') {
            return redirect()->route('member-loans.show', $memberLoan)
                ->with('error', 'Pinjaman yang sudah dikonfirmasi tidak dapat diedit.');
        }

        $members = Member::orderBy('name')->get(['id', 'name']);
        $banks   = Bank::orderBy('name')->get(['id', 'name']);

        return Inertia::render('transaction/member-loan/edit', [
            'loan'    => $memberLoan,
            'members' => $members,
            'banks'   => $banks,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MemberLoan $memberLoan): RedirectResponse
    {
        if ($memberLoan->status === 'confirmed') {
            return redirect()->route('member-loans.show', $memberLoan)
                ->with('error', 'Pinjaman yang sudah dikonfirmasi tidak dapat diedit.');
        }

        $request->validate([
            'member_id' => ['required', 'exists:members,id'],
            'loan_date' => ['required', 'date'],
            'amount'    => ['required', 'numeric', 'min:1'],
            'bank_id'   => ['nullable', 'exists:banks,id'],
            'notes'     => ['nullable', 'string'],
        ]);

        $memberLoan->update([
            'member_id'  => $request->member_id,
            'loan_date'  => $request->loan_date,
            'amount'     => $request->amount,
            'bank_id'    => $request->bank_id,
            'notes'      => $request->notes,
            'updated_by' => auth()->id(),
        ]);

        return redirect()->route('member-loans.show', $memberLoan)
            ->with('success', 'Pinjaman berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MemberLoan $memberLoan): RedirectResponse
    {
        if ($memberLoan->status === 'confirmed') {
            return redirect()->route('member-loans.index')
                ->with('error', 'Pinjaman yang sudah dikonfirmasi tidak dapat dihapus.');
        }

        $memberLoan->delete();

        return redirect()->route('member-loans.index')
            ->with('success', 'Pinjaman berhasil dihapus.');
    }

    /**
     * Confirm loan - post journal entry
     */
    public function confirm(MemberLoan $memberLoan): RedirectResponse
    {
        if ($memberLoan->status === 'confirmed') {
            return redirect()->route('member-loans.show', $memberLoan)
                ->with('error', 'Pinjaman sudah dikonfirmasi.');
        }

        DB::transaction(function () use ($memberLoan) {
            $memberLoan->update([
                'status'     => 'confirmed',
                'updated_by' => auth()->id(),
            ]);

            // Get Piutang Karyawan account (1202)
            $piutangAccount = ChartOfAccount::where('code', '1202')
                ->where('is_active', true)->first();

            if (!$piutangAccount) {
                throw new \Exception('Akun Piutang Karyawan (1202) tidak ditemukan.');
            }

            if ($memberLoan->is_opening_balance) {
                // Opening balance: Dr. Piutang Karyawan / Cr. Laba Ditahan
                $retainedEarnings = ChartOfAccount::where('code', '3103')
                    ->where('is_active', true)->first();

                if (!$retainedEarnings) {
                    throw new \Exception('Akun Laba Ditahan (3103) tidak ditemukan.');
                }

                $journal = JournalEntry::create([
                    'journal_number' => JournalEntry::generateJournalNumber(),
                    'journal_date'   => $memberLoan->loan_date,
                    'description'    => "Saldo Awal Pinjaman - {$memberLoan->member->name} #{$memberLoan->loan_number}",
                    'reference_type' => 'MemberLoan',
                    'reference_id'   => $memberLoan->id,
                    'status'         => 'posted',
                    'created_by'     => auth()->id(),
                    'updated_by'     => auth()->id(),
                ]);

                JournalEntryDetail::create([
                    'journal_entry_id'    => $journal->id,
                    'chart_of_account_id' => $piutangAccount->id,
                    'debit'               => $memberLoan->amount,
                    'credit'              => 0,
                    'description'         => "Saldo awal piutang {$memberLoan->member->name}",
                ]);

                JournalEntryDetail::create([
                    'journal_entry_id'    => $journal->id,
                    'chart_of_account_id' => $retainedEarnings->id,
                    'debit'               => 0,
                    'credit'              => $memberLoan->amount,
                    'description'         => "Saldo awal piutang {$memberLoan->member->name}",
                ]);
            } else {
                // New loan from bank: Dr. Piutang Karyawan / Cr. Bank
                if (!$memberLoan->bank_id) {
                    throw new \Exception('Bank harus dipilih untuk pinjaman baru.');
                }

                $bank = \App\Models\Bank::lockForUpdate()->find($memberLoan->bank_id);
                if (!$bank) {
                    throw new \Exception('Bank tidak ditemukan.');
                }

                // Get bank asset account
                $bankAccount = ChartOfAccount::where('name', 'like', "%{$bank->name}%")
                    ->where('type', 'asset')
                    ->where('is_active', true)
                    ->first();

                // Fallback to first bank/cash asset account
                if (!$bankAccount) {
                    $bankAccount = ChartOfAccount::whereIn('code', ['1100', '1101', '1102', '1103', '1104'])
                        ->where('is_active', true)->first();
                }

                $journal = JournalEntry::create([
                    'journal_number' => JournalEntry::generateJournalNumber(),
                    'journal_date'   => $memberLoan->loan_date,
                    'description'    => "Pinjaman Anggota - {$memberLoan->member->name} #{$memberLoan->loan_number}",
                    'reference_type' => 'MemberLoan',
                    'reference_id'   => $memberLoan->id,
                    'status'         => 'posted',
                    'created_by'     => auth()->id(),
                    'updated_by'     => auth()->id(),
                ]);

                JournalEntryDetail::create([
                    'journal_entry_id'    => $journal->id,
                    'chart_of_account_id' => $piutangAccount->id,
                    'debit'               => $memberLoan->amount,
                    'credit'              => 0,
                    'description'         => "Pinjaman anggota {$memberLoan->member->name}",
                ]);

                if ($bankAccount) {
                    JournalEntryDetail::create([
                        'journal_entry_id'    => $journal->id,
                        'chart_of_account_id' => $bankAccount->id,
                        'debit'               => 0,
                        'credit'              => $memberLoan->amount,
                        'description'         => "Pinjaman anggota {$memberLoan->member->name}",
                    ]);
                }

                // Update bank balance
                app(\App\Services\CashMovementService::class)->createMovement(
                    $bank,
                    'MemberLoan',
                    $memberLoan->id,
                    $memberLoan->loan_date,
                    0,
                    (float) $memberLoan->amount,
                    "Pinjaman Anggota #{$memberLoan->loan_number} - {$memberLoan->member->name}"
                );
            }
        });

        return redirect()->route('member-loans.show', $memberLoan)
            ->with('success', 'Pinjaman berhasil dikonfirmasi.');
    }

    /**
     * Unconfirm loan - reverse journal entry
     */
    public function unconfirm(MemberLoan $memberLoan): RedirectResponse
    {
        if ($memberLoan->status === 'pending') {
            return redirect()->route('member-loans.show', $memberLoan)
                ->with('error', 'Pinjaman belum dikonfirmasi.');
        }

        if ($memberLoan->payments()->where('status', 'confirmed')->count() > 0) {
            return redirect()->route('member-loans.show', $memberLoan)
                ->with('error', 'Tidak dapat membatalkan konfirmasi. Sudah ada pembayaran yang dikonfirmasi.');
        }

        DB::transaction(function () use ($memberLoan) {
            // Reverse journal entries
            $journals = \App\Models\JournalEntry::where('reference_type', 'MemberLoan')
                ->where('reference_id', $memberLoan->id)
                ->where('status', 'posted')
                ->get();

            foreach ($journals as $journal) {
                $journal->update(['status' => 'reversed']);
            }

            // Reverse bank cash movement if not opening balance
            if (!$memberLoan->is_opening_balance && $memberLoan->bank_id) {
                $movement = \App\Models\CashMovement::where('reference_type', 'MemberLoan')
                    ->where('reference_id', $memberLoan->id)->first();
                if ($movement) {
                    app(\App\Services\CashMovementService::class)->deleteMovement($movement);
                }
            }

            $memberLoan->update([
                'status'     => 'pending',
                'updated_by' => auth()->id(),
            ]);
        });

        return redirect()->route('member-loans.show', $memberLoan)
            ->with('success', 'Konfirmasi pinjaman dibatalkan.');
    }
}
