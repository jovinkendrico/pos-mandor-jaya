<?php

namespace App\Services;

use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\PurchaseReturn;
use App\Models\SaleReturn;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    /**
     * Create journal entry for confirmed sale
     * Debit: Kas/Bank (Asset)
     * Credit: Penjualan (Income)
     */
    public function createSaleJournal(Sale $sale, ?int $bankId = null): JournalEntry
    {
        DB::beginTransaction();
        try {
            // Get accounts
            if ($bankId) {
                $bank = \App\Models\Bank::find($bankId);
                $cashAccount = $bank?->chartOfAccount ?? ChartOfAccount::where('code', '1103')->first(); // Bank BCA default
            } else {
                $cashAccount = ChartOfAccount::where('code', '1101')->first(); // Kas Kecil default
            }

            $incomeAccount = ChartOfAccount::where('code', '4101')->first(); // Penjualan Barang Dagangan

            if (!$cashAccount || !$incomeAccount) {
                throw new \Exception('Chart of Account tidak ditemukan');
            }

            $journal = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date' => $sale->sale_date,
                'reference_type' => 'Sale',
                'reference_id' => $sale->id,
                'description' => "Penjualan #{$sale->sale_number}",
                'status' => 'posted',
            ]);

            // Debit: Kas/Bank
            JournalEntryDetail::create([
                'journal_entry_id' => $journal->id,
                'chart_of_account_id' => $cashAccount->id,
                'debit' => $sale->total_amount,
                'credit' => 0,
                'description' => "Penerimaan dari penjualan #{$sale->sale_number}",
            ]);

            // Credit: Penjualan
            JournalEntryDetail::create([
                'journal_entry_id' => $journal->id,
                'chart_of_account_id' => $incomeAccount->id,
                'debit' => 0,
                'credit' => $sale->total_amount,
                'description' => "Pendapatan penjualan #{$sale->sale_number}",
            ]);

            DB::commit();
            return $journal;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Create journal entry for confirmed purchase
     * Debit: Persediaan/HPP (Expense) atau Pembelian (Expense)
     * Credit: Kas/Bank (Asset) atau Hutang Usaha (Liability)
     */
    public function createPurchaseJournal(Purchase $purchase, ?int $bankId = null, bool $isCash = true): JournalEntry
    {
        DB::beginTransaction();
        try {
            // Get accounts
            $expenseAccount = ChartOfAccount::where('code', '5101')->first(); // HPP

            if ($isCash && $bankId) {
                $bank = \App\Models\Bank::find($bankId);
                $cashAccount = $bank?->chartOfAccount ?? ChartOfAccount::where('code', '1103')->first(); // Bank BCA default
            } elseif ($isCash) {
                $cashAccount = ChartOfAccount::where('code', '1101')->first(); // Kas Kecil default
            } else {
                $cashAccount = null;
            }

            $payableAccount = ChartOfAccount::where('code', '2101')->first(); // Hutang Usaha

            if (!$expenseAccount || (!$cashAccount && $isCash) || (!$payableAccount && !$isCash)) {
                throw new \Exception('Chart of Account tidak ditemukan');
            }

            $journal = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date' => $purchase->purchase_date,
                'reference_type' => 'Purchase',
                'reference_id' => $purchase->id,
                'description' => "Pembelian #{$purchase->purchase_number}",
                'status' => 'posted',
            ]);

            // Debit: HPP Pembelian
            JournalEntryDetail::create([
                'journal_entry_id' => $journal->id,
                'chart_of_account_id' => $expenseAccount->id,
                'debit' => $purchase->total_amount,
                'credit' => 0,
                'description' => "Biaya pembelian #{$purchase->purchase_number}",
            ]);

            if ($isCash) {
                // Credit: Kas/Bank (Cash payment)
                JournalEntryDetail::create([
                    'journal_entry_id' => $journal->id,
                    'chart_of_account_id' => $cashAccount->id,
                    'debit' => 0,
                    'credit' => $purchase->total_amount,
                    'description' => "Pembayaran pembelian #{$purchase->purchase_number}",
                ]);
            } else {
                // Credit: Hutang Usaha (Credit payment)
                JournalEntryDetail::create([
                    'journal_entry_id' => $journal->id,
                    'chart_of_account_id' => $payableAccount->id,
                    'debit' => 0,
                    'credit' => $purchase->total_amount,
                    'description' => "Hutang pembelian #{$purchase->purchase_number}",
                ]);
            }

            DB::commit();
            return $journal;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Create journal entry for confirmed sale return
     * Debit: Penjualan (Income) - mengurangi pendapatan
     * Credit: Kas/Bank (Asset) - mengembalikan uang
     */
    public function createSaleReturnJournal(SaleReturn $saleReturn, ?int $bankId = null): JournalEntry
    {
        DB::beginTransaction();
        try {
            if ($bankId) {
                $bank = \App\Models\Bank::find($bankId);
                $cashAccount = $bank?->chartOfAccount ?? ChartOfAccount::where('code', '1103')->first(); // Bank BCA default
            } else {
                $cashAccount = ChartOfAccount::where('code', '1101')->first(); // Kas Kecil default
            }
            $incomeAccount = ChartOfAccount::where('code', '4101')->first(); // Penjualan Barang Dagangan

            if (!$cashAccount || !$incomeAccount) {
                throw new \Exception('Chart of Account tidak ditemukan');
            }

            $journal = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date' => $saleReturn->return_date,
                'reference_type' => 'SaleReturn',
                'reference_id' => $saleReturn->id,
                'description' => "Retur Penjualan #{$saleReturn->return_number}",
                'status' => 'posted',
            ]);

            // Debit: Penjualan (mengurangi pendapatan)
            JournalEntryDetail::create([
                'journal_entry_id' => $journal->id,
                'chart_of_account_id' => $incomeAccount->id,
                'debit' => $saleReturn->total_amount,
                'credit' => 0,
                'description' => "Pengurangan pendapatan dari retur #{$saleReturn->return_number}",
            ]);

            // Credit: Kas/Bank (mengembalikan uang)
            JournalEntryDetail::create([
                'journal_entry_id' => $journal->id,
                'chart_of_account_id' => $cashAccount->id,
                'debit' => 0,
                'credit' => $saleReturn->total_amount,
                'description' => "Pengembalian uang retur #{$saleReturn->return_number}",
            ]);

            DB::commit();
            return $journal;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Create journal entry for confirmed purchase return
     * Debit: Kas/Bank (Asset) atau Hutang Usaha (Liability) - menerima kembali uang
     * Credit: HPP Pembelian (Expense) - mengurangi biaya
     */
    public function createPurchaseReturnJournal(PurchaseReturn $purchaseReturn, ?int $bankId = null, bool $isCash = true): JournalEntry
    {
        DB::beginTransaction();
        try {
            $expenseAccount = ChartOfAccount::where('code', '5101')->first(); // HPP

            if ($isCash && $bankId) {
                $bank = \App\Models\Bank::find($bankId);
                $cashAccount = $bank?->chartOfAccount ?? ChartOfAccount::where('code', '1103')->first(); // Bank BCA default
            } elseif ($isCash) {
                $cashAccount = ChartOfAccount::where('code', '1101')->first(); // Kas Kecil default
            } else {
                $cashAccount = null;
            }

            $payableAccount = ChartOfAccount::where('code', '2101')->first(); // Hutang Usaha

            if (!$expenseAccount || (!$cashAccount && $isCash) || (!$payableAccount && !$isCash)) {
                throw new \Exception('Chart of Account tidak ditemukan');
            }

            $journal = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date' => $purchaseReturn->return_date,
                'reference_type' => 'PurchaseReturn',
                'reference_id' => $purchaseReturn->id,
                'description' => "Retur Pembelian #{$purchaseReturn->return_number}",
                'status' => 'posted',
            ]);

            if ($isCash) {
                // Debit: Kas/Bank
                JournalEntryDetail::create([
                    'journal_entry_id' => $journal->id,
                    'chart_of_account_id' => $cashAccount->id,
                    'debit' => $purchaseReturn->total_amount,
                    'credit' => 0,
                    'description' => "Penerimaan kembali dari retur #{$purchaseReturn->return_number}",
                ]);
            } else {
                // Debit: Hutang Usaha (mengurangi hutang)
                JournalEntryDetail::create([
                    'journal_entry_id' => $journal->id,
                    'chart_of_account_id' => $payableAccount->id,
                    'debit' => $purchaseReturn->total_amount,
                    'credit' => 0,
                    'description' => "Pengurangan hutang dari retur #{$purchaseReturn->return_number}",
                ]);
            }

            // Credit: HPP Pembelian (mengurangi biaya)
            JournalEntryDetail::create([
                'journal_entry_id' => $journal->id,
                'chart_of_account_id' => $expenseAccount->id,
                'debit' => 0,
                'credit' => $purchaseReturn->total_amount,
                'description' => "Pengurangan biaya dari retur #{$purchaseReturn->return_number}",
            ]);

            DB::commit();
            return $journal;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Create manual journal entry
     * Must have balanced debit and credit
     */
    public function createManualJournal(array $data): JournalEntry
    {
        DB::beginTransaction();
        try {
            $journal = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date' => $data['journal_date'],
                'reference_type' => 'Manual',
                'reference_id' => null,
                'description' => $data['description'],
                'status' => $data['status'] ?? 'draft',
            ]);

            $totalDebit = 0;
            $totalCredit = 0;

            foreach ($data['details'] as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id' => $journal->id,
                    'chart_of_account_id' => $detail['chart_of_account_id'],
                    'debit' => $detail['debit'] ?? 0,
                    'credit' => $detail['credit'] ?? 0,
                    'description' => $detail['description'] ?? null,
                ]);

                $totalDebit += $detail['debit'] ?? 0;
                $totalCredit += $detail['credit'] ?? 0;
            }

            // Validate balance
            if (abs($totalDebit - $totalCredit) > 0.01) {
                throw new \Exception('Total debit dan credit harus sama');
            }

            DB::commit();
            return $journal->load('details');
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Post a draft journal entry
     */
    public function postJournal(JournalEntry $journal): void
    {
        if (!$journal->validateBalance()) {
            throw new \Exception('Journal entry tidak balance');
        }

        $journal->update(['status' => 'posted']);
    }

    /**
     * Reverse a journal entry
     */
    public function reverseJournal(JournalEntry $journal): JournalEntry
    {
        DB::beginTransaction();
        try {
            $reversedJournal = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date' => now(),
                'reference_type' => 'Reversal',
                'reference_id' => $journal->id,
                'description' => "Pembalikan jurnal #{$journal->journal_number}",
                'status' => 'posted',
                'reversed_by' => $journal->id,
            ]);

            // Reverse all details (swap debit and credit)
            foreach ($journal->details as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id' => $reversedJournal->id,
                    'chart_of_account_id' => $detail->chart_of_account_id,
                    'debit' => $detail->credit, // Swap
                    'credit' => $detail->debit, // Swap
                    'description' => "Pembalikan: {$detail->description}",
                ]);
            }

            $journal->update(['status' => 'reversed']);

            DB::commit();
            return $reversedJournal;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get profit/loss report from journal entries
     */
    public function getProfitLossReport(string $startDate, string $endDate): array
    {
        $journals = JournalEntry::whereBetween('journal_date', [$startDate, $endDate])
            ->where('status', 'posted')
            ->with(['details.chartOfAccount'])
            ->get();

        // Get income (Credit from income accounts)
        $incomeDetails = $journals->flatMap->details
            ->filter(fn($detail) => $detail->chartOfAccount->type === 'income');

        $totalIncome = $incomeDetails->sum('credit') - $incomeDetails->sum('debit');

        // Get expense (Debit from expense accounts)
        $expenseDetails = $journals->flatMap->details
            ->filter(fn($detail) => $detail->chartOfAccount->type === 'expense');

        $totalExpense = $expenseDetails->sum('debit') - $expenseDetails->sum('credit');

        // Get HPP from sales
        $sales = Sale::whereBetween('sale_date', [$startDate, $endDate])
            ->where('status', 'confirmed')
            ->get();

        $totalSales = $sales->sum('total_amount');
        $totalHpp = $sales->sum('total_cost');
        $grossProfit = $totalSales - $totalHpp;

        // Operational expenses (6100-6290)
        $operationalExpenseDetails = $expenseDetails->filter(
            fn($detail) => in_array($detail->chartOfAccount->code, ['6100', '6200', '6210', '6220', '6230', '6240', '6250', '6290'])
        );
        $operationalExpense = $operationalExpenseDetails->sum('debit') - $operationalExpenseDetails->sum('credit');

        $netProfit = $grossProfit - $operationalExpense;

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_sales' => $totalSales,
            'total_hpp' => $totalHpp,
            'gross_profit' => $grossProfit,
            'operational_expense' => $operationalExpense,
            'other_income' => 0, // Can be calculated separately
            'other_expense' => 0, // Can be calculated separately
            'net_profit' => $netProfit,
        ];
    }

    /**
     * Get daily cash flow from journal entries
     */
    public function getDailyCashFlow(string $date): array
    {
        $journals = JournalEntry::where('journal_date', $date)
            ->where('status', 'posted')
            ->with(['details.chartOfAccount'])
            ->get();

        // Cash/Bank accounts
        $cashAccounts = ChartOfAccount::whereIn('code', ['1100', '1110'])->pluck('id');

        $cashDetails = $journals->flatMap->details
            ->filter(fn($detail) => $cashAccounts->contains($detail->chart_of_account_id));

        $cashIn = $cashDetails->sum('debit');
        $cashOut = $cashDetails->sum('credit');
        $netCash = $cashIn - $cashOut;

        return [
            'date' => $date,
            'cash_in' => $cashIn,
            'cash_out' => $cashOut,
            'net_cash' => $netCash,
            'journals' => $journals,
        ];
    }
}
