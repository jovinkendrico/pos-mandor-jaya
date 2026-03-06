<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\MemberLoan;
use App\Models\MemberLoanPayment;
use App\Models\Bank;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class MemberLoanPaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = MemberLoanPayment::with(['loan.member', 'bank', 'creator']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('payment_number', 'like', "%{$search}%")
                  ->orWhereHas('loan.member', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('payment_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('payment_date', '<=', $request->date_to);
        }

        $query->orderByRaw('CAST(SUBSTRING(payment_number, 3) AS UNSIGNED) DESC');

        $payments = $query->paginate(15)->withQueryString();

        return Inertia::render('transaction/member-loan-payment/index', [
            'payments' => $payments,
            'filters'  => [
                'search'    => $request->get('search', ''),
                'status'    => $request->get('status', 'all'),
                'date_from' => $request->get('date_from', ''),
                'date_to'   => $request->get('date_to', ''),
            ],
        ]);
    }

    /**
     * Show form to create a payment for a loan
     */
    public function create(Request $request): Response
    {
        $loanId = $request->get('member_loan_id');
        $loan   = $loanId ? MemberLoan::with('member')->find($loanId) : null;
        if ($loan) {
            $loan->append(['total_paid', 'remaining_amount']);
        }

        $banks = Bank::orderBy('name')->get(['id', 'name']);

        return Inertia::render('transaction/member-loan-payment/create', [
            'loan'  => $loan,
            'banks' => $banks,
        ]);
    }

    /**
     * Store a new payment
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'member_loan_id' => ['required', 'exists:member_loans,id'],
            'payment_date'   => ['required', 'date'],
            'amount'         => ['required', 'numeric', 'min:1'],
            'bank_id'        => ['nullable', 'exists:banks,id'],
            'notes'          => ['nullable', 'string'],
        ]);

        $loan = MemberLoan::findOrFail($request->member_loan_id);

        if ($loan->status !== 'confirmed') {
            return back()->with('error', 'Pinjaman belum dikonfirmasi.');
        }

        DB::transaction(function () use ($request, $loan) {
            $maxRetries = 5;
            for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
                try {
                    $paymentNumber = MemberLoanPayment::generatePaymentNumber();
                    MemberLoanPayment::create([
                        'payment_number'  => $paymentNumber,
                        'member_loan_id'  => $loan->id,
                        'member_id'       => $loan->member_id,
                        'payment_date'    => $request->payment_date,
                        'amount'          => $request->amount,
                        'bank_id'         => $request->bank_id,
                        'notes'           => $request->notes,
                        'status'          => 'pending',
                        'created_by'      => auth()->id(),
                        'updated_by'      => auth()->id(),
                    ]);
                    break;
                } catch (\Illuminate\Database\QueryException $e) {
                    if ($e->getCode() == 23000 && str_contains($e->getMessage(), 'payment_number')) {
                        if ($attempt === 4) throw $e;
                        usleep(10000 * ($attempt + 1));
                        continue;
                    }
                    throw $e;
                }
            }
        });

        return redirect()->route('member-loans.show', $loan)
            ->with('success', 'Pembayaran berhasil ditambahkan.');
    }

    /**
     * Show the specified payment
     */
    public function show(MemberLoanPayment $memberLoanPayment): Response
    {
        $memberLoanPayment->load(['loan.member', 'bank', 'member', 'creator', 'updater']);

        return Inertia::render('transaction/member-loan-payment/show', [
            'payment' => $memberLoanPayment,
        ]);
    }

    /**
     * Remove the specified payment
     */
    public function destroy(MemberLoanPayment $memberLoanPayment): RedirectResponse
    {
        if ($memberLoanPayment->status === 'confirmed') {
            return back()->with('error', 'Pembayaran yang sudah dikonfirmasi tidak dapat dihapus.');
        }

        $loanId = $memberLoanPayment->member_loan_id;
        $memberLoanPayment->delete();

        return redirect()->route('member-loans.show', $loanId)
            ->with('success', 'Pembayaran berhasil dihapus.');
    }

    /**
     * Confirm payment - post journal entry
     * Dr. Bank / Cr. Piutang Karyawan
     */
    public function confirm(MemberLoanPayment $memberLoanPayment): RedirectResponse
    {
        if ($memberLoanPayment->status === 'confirmed') {
            return back()->with('error', 'Pembayaran sudah dikonfirmasi.');
        }

        $result = DB::transaction(function () use ($memberLoanPayment) {
            $memberLoanPayment = MemberLoanPayment::lockForUpdate()->find($memberLoanPayment->id);

            if ($memberLoanPayment->status === 'confirmed') {
                return redirect()->route('member-loans.show', $memberLoanPayment->member_loan_id)
                    ->with('error', 'Pembayaran sudah dikonfirmasi.');
            }

            $memberLoanPayment->update([
                'status'     => 'confirmed',
                'updated_by' => auth()->id(),
            ]);

            $memberLoanPayment->load('loan.member', 'bank');

            // Get Piutang Karyawan (1202)
            $piutangAccount = ChartOfAccount::where('code', '1202')
                ->where('is_active', true)->first();

            if (!$piutangAccount) {
                throw new \Exception('Akun Piutang Karyawan (1202) tidak ditemukan.');
            }

            // Create Cash In if bank selected
            if ($memberLoanPayment->bank_id) {
                $cashIn = \App\Models\CashIn::create([
                    'cash_in_number'       => \App\Models\CashIn::generateCashInNumber(),
                    'cash_in_date'         => $memberLoanPayment->payment_date,
                    'bank_id'              => $memberLoanPayment->bank_id,
                    'chart_of_account_id'  => $piutangAccount->id,
                    'amount'               => $memberLoanPayment->amount,
                    'description'          => "Cicilan Pinjaman - {$memberLoanPayment->loan->member->name} #{$memberLoanPayment->payment_number}",
                    'status'               => 'posted',
                    'reference_type'       => 'MemberLoanPayment',
                    'reference_id'         => $memberLoanPayment->id,
                    'created_by'           => auth()->id(),
                    'updated_by'           => auth()->id(),
                ]);

                app(\App\Services\JournalService::class)->postCashIn($cashIn);
            } else {
                // Manual journal if no bank
                $journal = JournalEntry::create([
                    'journal_number' => JournalEntry::generateJournalNumber(),
                    'journal_date'   => $memberLoanPayment->payment_date,
                    'description'    => "Cicilan Pinjaman - {$memberLoanPayment->loan->member->name} #{$memberLoanPayment->payment_number}",
                    'reference_type' => 'MemberLoanPayment',
                    'reference_id'   => $memberLoanPayment->id,
                    'status'         => 'posted',
                ]);

                JournalEntryDetail::create([
                    'journal_entry_id'    => $journal->id,
                    'chart_of_account_id' => $piutangAccount->id,
                    'debit'               => 0,
                    'credit'              => $memberLoanPayment->amount,
                    'description'         => "Cicilan pinjaman",
                ]);
            }

            return null;
        });

        if ($result instanceof \Illuminate\Http\RedirectResponse) {
            return $result;
        }

        return redirect()->route('member-loans.show', $memberLoanPayment->member_loan_id)
            ->with('success', 'Pembayaran berhasil dikonfirmasi.');
    }

    /**
     * Unconfirm payment - reverse journal
     */
    public function unconfirm(MemberLoanPayment $memberLoanPayment): RedirectResponse
    {
        if ($memberLoanPayment->status === 'pending') {
            return back()->with('error', 'Pembayaran belum dikonfirmasi.');
        }

        DB::transaction(function () use ($memberLoanPayment) {
            // Find and reverse cash in
            $cashIn = \App\Models\CashIn::where('reference_type', 'MemberLoanPayment')
                ->where('reference_id', $memberLoanPayment->id)
                ->where('status', 'posted')->first();

            if ($cashIn) {
                app(\App\Services\JournalService::class)->reverseCashIn($cashIn);
                $cashIn->delete();
            } else {
                // Reverse manual journal entries
                \App\Models\JournalEntry::where('reference_type', 'MemberLoanPayment')
                    ->where('reference_id', $memberLoanPayment->id)
                    ->where('status', 'posted')
                    ->update(['status' => 'reversed']);
            }

            $memberLoanPayment->update([
                'status'     => 'pending',
                'updated_by' => auth()->id(),
            ]);
        });

        return redirect()->route('member-loans.show', $memberLoanPayment->member_loan_id)
            ->with('success', 'Konfirmasi pembayaran dibatalkan.');
    }
}
