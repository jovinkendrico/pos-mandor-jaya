<?php

namespace App\Services;

use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use App\Models\ChartOfAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class JournalService
{
    /**
     * Post cash in to journal
     */
    public function postCashIn($cashIn): void
    {
        DB::transaction(function () use ($cashIn) {
            $cashIn->loadMissing(['bank', 'chartOfAccount']);

            if (!$cashIn->bank || !$cashIn->chartOfAccount) {
                return back()->with('error', 'Bank atau Chart of Account tidak ditemukan');
            }

            // Get bank's chart of account
            $bankAccount = $cashIn->bank->chart_of_account_id;
            if (!$bankAccount) {
                return back()->with('error', 'Bank tidak memiliki Chart of Account yang terkait');
            }

            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => $cashIn->cash_in_date,
                'reference_type' => 'CashIn',
                'reference_id'   => $cashIn->id,
                'description'    => "Kas Masuk #{$cashIn->cash_in_number}: {$cashIn->description}",
                'status'         => 'posted',
            ]);

            // Debit: Bank/Cash Account
            JournalEntryDetail::create([
                'journal_entry_id'    => $journalEntry->id,
                'chart_of_account_id' => $bankAccount,
                'debit'               => $cashIn->amount,
                'credit'              => 0,
                'description'         => "Kas Masuk #{$cashIn->cash_in_number}",
            ]);

            // Credit: Income Account
            JournalEntryDetail::create([
                'journal_entry_id'    => $journalEntry->id,
                'chart_of_account_id' => $cashIn->chart_of_account_id,
                'debit'               => 0,
                'credit'              => $cashIn->amount,
                'description'         => "Kas Masuk #{$cashIn->cash_in_number}",
            ]);

            // Create cash movement and update bank balance
            app(\App\Services\CashMovementService::class)->createMovement(
                $cashIn->bank,
                'CashIn',
                $cashIn->id,
                $cashIn->cash_in_date,
                (float) $cashIn->amount,
                0,
                "Kas Masuk #{$cashIn->cash_in_number}: {$cashIn->description}"
            );

            // Update cash in status
            $cashIn->update(['status' => 'posted']);
        });
    }

    /**
     * Post cash out to journal
     * For PurchasePayment: Debit Hutang Usaha, Credit Bank
     * For other CashOut: Debit Expense Account, Credit Bank
     */
    public function postCashOut($cashOut): void
    {
        DB::transaction(function () use ($cashOut) {
            $cashOut->loadMissing(['bank', 'chartOfAccount']);

            if (!$cashOut->bank || !$cashOut->chartOfAccount) {
                throw new \Exception('Bank atau Chart of Account tidak ditemukan');
            }

            // Get bank's chart of account
            $bankAccount = $cashOut->bank->chart_of_account_id;
            if (!$bankAccount) {
                // Try to get from bank relationship
                $bankAccount = $cashOut->bank->chartOfAccount?->id;
                if (!$bankAccount) {
                    return back()->with('error', 'Bank tidak memiliki Chart of Account yang terkait');
                }
            }

            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => $cashOut->cash_out_date,
                'reference_type' => 'CashOut',
                'reference_id'   => $cashOut->id,
                'description'    => "Kas Keluar #{$cashOut->cash_out_number}: {$cashOut->description}",
                'status'         => 'posted',
            ]);

            // Debit: Chart of Account (bisa Hutang Usaha untuk pembayaran pembelian, atau Expense untuk lainnya)
            JournalEntryDetail::create([
                'journal_entry_id'    => $journalEntry->id,
                'chart_of_account_id' => $cashOut->chart_of_account_id,
                'debit'               => $cashOut->amount,
                'credit'              => 0,
                'description'         => "Kas Keluar #{$cashOut->cash_out_number}",
            ]);

            // Credit: Bank/Cash Account
            JournalEntryDetail::create([
                'journal_entry_id'    => $journalEntry->id,
                'chart_of_account_id' => $bankAccount,
                'debit'               => 0,
                'credit'              => $cashOut->amount,
                'description'         => "Kas Keluar #{$cashOut->cash_out_number}",
            ]);

            // Create cash movement and update bank balance
            app(\App\Services\CashMovementService::class)->createMovement(
                $cashOut->bank,
                'CashOut',
                $cashOut->id,
                $cashOut->cash_out_date,
                0,
                (float) $cashOut->amount,
                "Kas Keluar #{$cashOut->cash_out_number}: {$cashOut->description}"
            );

            // Update cash out status
            $cashOut->update(['status' => 'posted']);
        });
    }

    /**
     * Reverse cash in journal entry
     */
    public function reverseCashIn($cashIn): void
    {
        DB::transaction(function () use ($cashIn) {
            $journalEntry = JournalEntry::where('reference_type', 'CashIn')
                ->where('reference_id', $cashIn->id)
                ->where('status', 'posted')
                ->first();

            if (!$journalEntry) {
                throw new \Exception('Journal entry tidak ditemukan');
            }

            // Create reversal entry
            $reversalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => now(),
                'reference_type' => 'CashIn',
                'reference_id'   => $cashIn->id,
                'description'    => "Pembalikan Kas Masuk #{$cashIn->cash_in_number}",
                'status'         => 'reversed',
                'reversed_by'    => $journalEntry->id,
            ]);

            // Reverse all details
            foreach ($journalEntry->details as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $reversalEntry->id,
                    'chart_of_account_id' => $detail->chart_of_account_id,
                    'debit'               => $detail->credit, // Swap debit and credit
                    'credit'              => $detail->debit,
                    'description'         => "Pembalikan: {$detail->description}",
                ]);
            }

            // Reverse cash movement
            $cashMovement = \App\Models\CashMovement::where('reference_type', 'CashIn')
                ->where('reference_id', $cashIn->id)
                ->first();

            if ($cashMovement) {
                app(\App\Services\CashMovementService::class)->reverseMovement($cashMovement);
            }

            // Update journal entry status to reversed (not cancelled)
            $journalEntry->update(['status' => 'reversed']);

            // Update cash in status
            $cashIn->update(['status' => 'cancelled']);
        });
    }

    /**
     * Reverse cash out journal entry
     */
    public function reverseCashOut($cashOut): void
    {
        DB::transaction(function () use ($cashOut) {
            $journalEntry = JournalEntry::where('reference_type', 'CashOut')
                ->where('reference_id', $cashOut->id)
                ->where('status', 'posted')
                ->first();

            if (!$journalEntry) {
                throw new \Exception('Journal entry tidak ditemukan');
            }

            // Create reversal entry
            $reversalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => now(),
                'reference_type' => 'CashOut',
                'reference_id'   => $cashOut->id,
                'description'    => "Pembalikan Kas Keluar #{$cashOut->cash_out_number}",
                'status'         => 'reversed',
                'reversed_by'    => $journalEntry->id,
            ]);

            // Reverse all details
            foreach ($journalEntry->details as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $reversalEntry->id,
                    'chart_of_account_id' => $detail->chart_of_account_id,
                    'debit'               => $detail->credit, // Swap debit and credit
                    'credit'              => $detail->debit,
                    'description'         => "Pembalikan: {$detail->description}",
                ]);
            }

            // Reverse cash movement
            $cashMovement = \App\Models\CashMovement::where('reference_type', 'CashOut')
                ->where('reference_id', $cashOut->id)
                ->first();

            if ($cashMovement) {
                app(\App\Services\CashMovementService::class)->reverseMovement($cashMovement);
            }

            // Update journal entry status to reversed
            $journalEntry->update(['status' => 'reversed']);

            // Update cash out status
            $cashOut->update(['status' => 'cancelled']);
        });
    }

    /**
     * Post sale to journal
     * Debit: Piutang Usaha (total_amount)
     * Credit: Pendapatan Penjualan (total_after_discount, tanpa PPN)
     * Credit: Pajak Keluaran (ppn_amount, jika ada PPN)
     * Debit: HPP (total_cost)
     * Credit: Persediaan (total_cost)
     */
    public function postSale($sale): void
    {
        DB::transaction(function () use ($sale) {
            $sale->loadMissing(['details.item']);

            // Get accounts
            $receivableAccount = ChartOfAccount::where('code', '1201') // Piutang Usaha
                ->where('is_active', true)
                ->first();

            $incomeAccount = ChartOfAccount::where('code', '4101') // Penjualan Barang Dagangan
                ->where('is_active', true)
                ->first();

            $hppAccount = ChartOfAccount::where('code', '5101') // HPP
                ->where('is_active', true)
                ->first();

            $inventoryAccount = ChartOfAccount::where('code', '1301') // Persediaan Barang
                ->where('is_active', true)
                ->first();

            // Get Pajak Keluaran account (2102 - Hutang Pajak)
            $taxAccount = ChartOfAccount::where('code', '2102') // Hutang Pajak
                ->where('is_active', true)
                ->first();

            if (!$receivableAccount || !$incomeAccount || !$hppAccount || !$inventoryAccount) {
                throw new \Exception('Chart of Account tidak ditemukan. Pastikan akun Piutang Usaha (1201), Pendapatan (4101), HPP (5101), dan Persediaan (1301) sudah ada.');
            }

            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => $sale->sale_date,
                'reference_type' => 'Sale',
                'reference_id'   => $sale->id,
                'description'    => "Penjualan #{$sale->sale_number}",
                'status'         => 'posted',
            ]);

            // Debit: Piutang Usaha (total amount termasuk PPN)
            JournalEntryDetail::create([
                'journal_entry_id'    => $journalEntry->id,
                'chart_of_account_id' => $receivableAccount->id,
                'debit'               => $sale->total_amount,
                'credit'              => 0,
                'description'         => "Piutang dari Penjualan #{$sale->sale_number}",
            ]);

            // Credit: Pendapatan Penjualan (hanya total setelah diskon, tanpa PPN)
            $incomeAmount = (float) $sale->total_after_discount;
            JournalEntryDetail::create([
                'journal_entry_id'    => $journalEntry->id,
                'chart_of_account_id' => $incomeAccount->id,
                'debit'               => 0,
                'credit'              => $incomeAmount,
                'description'         => "Pendapatan dari Penjualan #{$sale->sale_number}",
            ]);

            // Credit: Pajak Keluaran (jika ada PPN)
            $ppnAmount = (float) ($sale->ppn_amount ?? 0);
            if ($ppnAmount > 0 && $taxAccount) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $taxAccount->id,
                    'debit'               => 0,
                    'credit'              => $ppnAmount,
                    'description'         => "PPN Keluaran dari Penjualan #{$sale->sale_number}",
                ]);
            }

            // Debit: HPP
            if ($sale->total_cost > 0) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $hppAccount->id,
                    'debit'               => $sale->total_cost,
                    'credit'              => 0,
                    'description'         => "HPP Penjualan #{$sale->sale_number}",
                ]);

                // Credit: Persediaan
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $inventoryAccount->id,
                    'debit'               => 0,
                    'credit'              => $sale->total_cost,
                    'description'         => "Pengurangan Persediaan dari Penjualan #{$sale->sale_number}",
                ]);
            }
        });
    }

    /**
     * Reverse sale journal entry
     */
    public function reverseSale($sale): void
    {
        DB::transaction(function () use ($sale) {
            $journalEntry = JournalEntry::where('reference_type', 'Sale')
                ->where('reference_id', $sale->id)
                ->where('status', 'posted')
                ->first();

            if (!$journalEntry) {
                throw new \Exception('Journal entry tidak ditemukan');
            }

            // Create reversal entry
            $reversalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => now(),
                'reference_type' => 'Sale',
                'reference_id'   => $sale->id,
                'description'    => "Pembalikan Penjualan #{$sale->sale_number}",
                'status'         => 'reversed',
                'reversed_by'    => $journalEntry->id,
            ]);

            // Reverse all details
            foreach ($journalEntry->details as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $reversalEntry->id,
                    'chart_of_account_id' => $detail->chart_of_account_id,
                    'debit'               => $detail->credit, // Swap debit and credit
                    'credit'              => $detail->debit,
                    'description'         => "Pembalikan: {$detail->description}",
                ]);
            }

            // Update journal entry status
            $journalEntry->update(['status' => 'reversed']);
        });
    }

    /**
     * Post purchase to journal
     * Debit: Persediaan (total_after_discount, tanpa PPN)
     * Debit: Pajak Masukan (ppn_amount, jika ada PPN)
     * Credit: Hutang Usaha (total_amount)
     */
    public function postPurchase($purchase): void
    {
        DB::transaction(function () use ($purchase) {
            $purchase->loadMissing(['details.item']);

            // Get accounts
            $payableAccount = ChartOfAccount::where('code', '2101') // Hutang Usaha
                ->where('is_active', true)
                ->first();

            $inventoryAccount = ChartOfAccount::where('code', '1301') // Persediaan Barang
                ->where('is_active', true)
                ->first();

            // Get Pajak Masukan account (1402 - Pajak dibayar dimuka atau 2102 - Hutang Pajak)
            $taxAccount = ChartOfAccount::where('code', '1402') // Pajak dibayar dimuka
                ->where('is_active', true)
                ->first();

            if (!$taxAccount) {
                $taxAccount = ChartOfAccount::where('code', '2102') // Hutang Pajak
                    ->where('is_active', true)
                    ->first();
            }

            if (!$payableAccount || !$inventoryAccount) {
                throw new \Exception('Chart of Account tidak ditemukan. Pastikan akun Hutang Usaha (2101) dan Persediaan (1301) sudah ada.');
            }

            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => $purchase->purchase_date,
                'reference_type' => 'Purchase',
                'reference_id'   => $purchase->id,
                'description'    => "Pembelian #{$purchase->purchase_number}",
                'status'         => 'posted',
            ]);

            // Debit: Persediaan (hanya total setelah diskon, tanpa PPN)
            $inventoryAmount = (float) $purchase->total_after_discount;
            JournalEntryDetail::create([
                'journal_entry_id'    => $journalEntry->id,
                'chart_of_account_id' => $inventoryAccount->id,
                'debit'               => $inventoryAmount,
                'credit'              => 0,
                'description'         => "Penambahan Persediaan dari Pembelian #{$purchase->purchase_number}",
            ]);

            // Debit: Pajak Masukan (jika ada PPN)
            $ppnAmount = (float) ($purchase->ppn_amount ?? 0);
            if ($ppnAmount > 0 && $taxAccount) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $taxAccount->id,
                    'debit'               => $ppnAmount,
                    'credit'              => 0,
                    'description'         => "PPN Masukan dari Pembelian #{$purchase->purchase_number}",
                ]);
            }

            // Credit: Hutang Usaha (total amount termasuk PPN)
            JournalEntryDetail::create([
                'journal_entry_id'    => $journalEntry->id,
                'chart_of_account_id' => $payableAccount->id,
                'debit'               => 0,
                'credit'              => $purchase->total_amount,
                'description'         => "Hutang dari Pembelian #{$purchase->purchase_number}",
            ]);
        });
    }

    /**
     * Reverse purchase journal entry
     */
    public function reversePurchase($purchase): void
    {
        DB::transaction(function () use ($purchase) {
            $journalEntry = JournalEntry::where('reference_type', 'Purchase')
                ->where('reference_id', $purchase->id)
                ->where('status', 'posted')
                ->first();

            if (!$journalEntry) {
                throw new \Exception('Journal entry tidak ditemukan');
            }

            // Create reversal entry
            $reversalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => now(),
                'reference_type' => 'Purchase',
                'reference_id'   => $purchase->id,
                'description'    => "Pembalikan Pembelian #{$purchase->purchase_number}",
                'status'         => 'reversed',
                'reversed_by'    => $journalEntry->id,
            ]);

            // Reverse all details
            foreach ($journalEntry->details as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $reversalEntry->id,
                    'chart_of_account_id' => $detail->chart_of_account_id,
                    'debit'               => $detail->credit, // Swap debit and credit
                    'credit'              => $detail->debit,
                    'description'         => "Pembalikan: {$detail->description}",
                ]);
            }

            // Update journal entry status
            $journalEntry->update(['status' => 'reversed']);
        });
    }

    /**
     * Post bank opening balance to journal
     * Debit: Bank/Cash Account
     * Credit: Modal (3100) atau akun khusus untuk saldo awal
     */
    public function postBankOpeningBalance($bank, float $oldBalance = 0): void
    {
        DB::transaction(function () use ($bank, $oldBalance) {
            if (!$bank->chart_of_account_id) {
                return back()->with('error', 'Bank tidak memiliki Chart of Account yang terkait');
            }

            $newBalance        = (float) $bank->balance;
            $balanceDifference = $newBalance - $oldBalance;

            // Jika tidak ada perubahan saldo, skip
            if (abs($balanceDifference) < 0.01) {
                return;
            }

            // Get Modal account (3100) atau akun khusus untuk saldo awal
            $equityAccount = ChartOfAccount::where('code', '3100')
                ->where('is_active', true)
                ->first();

            if (!$equityAccount) {
                // Fallback: cari akun equity/modal lainnya
                $equityAccount = ChartOfAccount::whereIn('type', ['equity', 'modal'])
                    ->where('is_active', true)
                    ->orderBy('code')
                    ->first();
            }

            if (!$equityAccount) {
                throw new \Exception('Akun Modal tidak ditemukan. Pastikan akun Modal (3100) sudah ada.');
            }

            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => now(),
                'reference_type' => 'Bank',
                'reference_id'   => $bank->id,
                'description'    => "Saldo Awal " . ($bank->type === 'cash' ? 'Kas' : 'Bank') . ": {$bank->name}",
                'status'         => 'posted',
            ]);

            // Create cash movement for opening balance adjustment
            if ($balanceDifference > 0) {
                app(\App\Services\CashMovementService::class)->createMovement(
                    $bank,
                    'Bank',
                    $bank->id,
                    now(),
                    $balanceDifference,
                    0,
                    "Saldo Awal " . ($bank->type === 'cash' ? 'Kas' : 'Bank') . ": {$bank->name}"
                );
            } else {
                app(\App\Services\CashMovementService::class)->createMovement(
                    $bank,
                    'Bank',
                    $bank->id,
                    now(),
                    0,
                    abs($balanceDifference),
                    "Penyesuaian Saldo " . ($bank->type === 'cash' ? 'Kas' : 'Bank') . ": {$bank->name}"
                );
            }

            if ($balanceDifference > 0) {
                // Saldo bertambah: Debit Bank, Credit Modal
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $bank->chart_of_account_id,
                    'debit'               => $balanceDifference,
                    'credit'              => 0,
                    'description'         => "Saldo Awal {$bank->name}",
                ]);

                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $equityAccount->id,
                    'debit'               => 0,
                    'credit'              => $balanceDifference,
                    'description'         => "Saldo Awal {$bank->name}",
                ]);
            } else {
                // Saldo berkurang: Debit Modal, Credit Bank
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $equityAccount->id,
                    'debit'               => abs($balanceDifference),
                    'credit'              => 0,
                    'description'         => "Penyesuaian Saldo {$bank->name}",
                ]);

                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $bank->chart_of_account_id,
                    'debit'               => 0,
                    'credit'              => abs($balanceDifference),
                    'description'         => "Penyesuaian Saldo {$bank->name}",
                ]);
            }
        });
    }

    /**
     * Post item opening stock to journal
     * Debit: Persediaan (1301)
     * Credit: Modal (3100) atau akun khusus untuk persediaan awal
     */
    public function postItemOpeningStock($item, float $quantity, float $unitCost): void
    {
        DB::transaction(function () use ($item, $quantity, $unitCost) {
            if ($quantity <= 0 || $unitCost <= 0) {
                return; // Skip jika tidak ada stok atau harga
            }

            $totalCost = $quantity * $unitCost;

            // Get Persediaan account (1301)
            $inventoryAccount = ChartOfAccount::where('code', '1301')
                ->where('is_active', true)
                ->first();

            if (!$inventoryAccount) {
                throw new \Exception('Akun Persediaan tidak ditemukan. Pastikan akun Persediaan (1301) sudah ada.');
            }

            // Get Modal account (3100)
            $equityAccount = ChartOfAccount::where('code', '3100')
                ->where('is_active', true)
                ->first();

            if (!$equityAccount) {
                // Fallback: cari akun equity/modal lainnya
                $equityAccount = ChartOfAccount::whereIn('type', ['equity', 'modal'])
                    ->where('is_active', true)
                    ->orderBy('code')
                    ->first();
            }

            if (!$equityAccount) {
                throw new \Exception('Akun Modal tidak ditemukan. Pastikan akun Modal (3100) sudah ada.');
            }

            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => now(),
                'reference_type' => 'Item',
                'reference_id'   => $item->id,
                'description'    => "Stok Awal Barang: {$item->name} ({$item->code})",
                'status'         => 'posted',
            ]);

            // Debit: Persediaan
            JournalEntryDetail::create([
                'journal_entry_id'    => $journalEntry->id,
                'chart_of_account_id' => $inventoryAccount->id,
                'debit'               => $totalCost,
                'credit'              => 0,
                'description'         => "Stok Awal {$item->name}",
            ]);

            // Credit: Modal
            JournalEntryDetail::create([
                'journal_entry_id'    => $journalEntry->id,
                'chart_of_account_id' => $equityAccount->id,
                'debit'               => 0,
                'credit'              => $totalCost,
                'description'         => "Stok Awal {$item->name}",
            ]);
        });
    }

    /**
     * Post stock adjustment to journal
     * If increase: Debit Persediaan, Credit Modal
     * If decrease: Debit HPP/Penyesuaian, Credit Persediaan
     */
    public function postStockAdjustment($stockMovement): void
    {
        DB::transaction(function () use ($stockMovement) {
            $stockMovement->loadMissing('item');

            if (!$stockMovement->item) {
                throw new \Exception('Item tidak ditemukan untuk stock adjustment');
            }

            $quantity    = (float) $stockMovement->quantity;
            $unitCost    = (float) $stockMovement->unit_cost;
            $totalAmount = abs($quantity) * $unitCost;

            if ($totalAmount <= 0) {
                return; // Skip if no amount
            }

            // Get accounts
            $inventoryAccount = ChartOfAccount::where('code', '1301') // Persediaan Barang
                ->where('is_active', true)
                ->first();

            if (!$inventoryAccount) {
                throw new \Exception('Akun Persediaan tidak ditemukan. Pastikan akun Persediaan (1301) sudah ada.');
            }

            // Get Modal account (3100) for increase
            $equityAccount = ChartOfAccount::where('code', '3100')
                ->where('is_active', true)
                ->first();

            if (!$equityAccount) {
                $equityAccount = ChartOfAccount::whereIn('type', ['equity', 'modal'])
                    ->where('is_active', true)
                    ->orderBy('code')
                    ->first();
            }

            // Get HPP/Penyesuaian account (5104) for decrease
            $adjustmentAccount = ChartOfAccount::where('code', '5104') // Penyesuaian Stok
                ->where('is_active', true)
                ->first();

            if (!$adjustmentAccount) {
                // Fallback to HPP
                $adjustmentAccount = ChartOfAccount::where('code', '5101') // HPP
                    ->where('is_active', true)
                    ->first();
            }

            if (!$equityAccount || !$adjustmentAccount) {
                throw new \Exception('Akun Modal atau HPP tidak ditemukan.');
            }

            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => $stockMovement->movement_date,
                'reference_type' => 'StockAdjustment',
                'reference_id'   => $stockMovement->id,
                'description'    => "Penyesuaian Stok: {$stockMovement->item->name} ({$stockMovement->item->code}) - {$stockMovement->notes}",
                'status'         => 'posted',
            ]);

            if ($quantity > 0) {
                // Increase stock: Debit Persediaan, Credit Modal
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $inventoryAccount->id,
                    'debit'               => $totalAmount,
                    'credit'              => 0,
                    'description'         => "Penambahan Persediaan: {$stockMovement->item->name}",
                ]);

                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $equityAccount->id,
                    'debit'               => 0,
                    'credit'              => $totalAmount,
                    'description'         => "Penyesuaian Stok: {$stockMovement->item->name}",
                ]);
            } else {
                // Decrease stock: Debit HPP/Penyesuaian, Credit Persediaan
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $adjustmentAccount->id,
                    'debit'               => $totalAmount,
                    'credit'              => 0,
                    'description'         => "Pengurangan Persediaan: {$stockMovement->item->name}",
                ]);

                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $inventoryAccount->id,
                    'debit'               => 0,
                    'credit'              => $totalAmount,
                    'description'         => "Penyesuaian Stok: {$stockMovement->item->name}",
                ]);
            }
        });
    }

    /**
     * Reverse stock adjustment journal entry
     */
    public function reverseStockAdjustment($stockMovement): void
    {
        DB::transaction(function () use ($stockMovement) {
            $journalEntry = JournalEntry::where('reference_type', 'StockAdjustment')
                ->where('reference_id', $stockMovement->id)
                ->where('status', 'posted')
                ->first();

            if (!$journalEntry) {
                return; // No journal entry to reverse
            }

            // Create reversal entry
            $reversalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => now(),
                'reference_type' => 'StockAdjustment',
                'reference_id'   => $stockMovement->id,
                'description'    => "Pembalikan Penyesuaian Stok: " . ($stockMovement->item->name ?? ''),
                'status'         => 'reversed',
                'reversed_by'    => $journalEntry->id,
            ]);

            // Reverse all details
            foreach ($journalEntry->details as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $reversalEntry->id,
                    'chart_of_account_id' => $detail->chart_of_account_id,
                    'debit'               => $detail->credit,
                    'credit'              => $detail->debit,
                    'description'         => "Pembalikan: {$detail->description}",
                ]);
            }

            // Update journal entry status
            $journalEntry->update(['status' => 'reversed']);
        });
    }

    /**
     * Adjust COGS for a sale when stock costs are reconciled (e.g. negative stock replenishment)
     */
    public function adjustSaleCogs($sale, float $costDifference): void
    {
        if (abs($costDifference) < 0.01) {
            return;
        }

        DB::transaction(function () use ($sale, $costDifference) {
            // Get accounts
            $hppAccount = ChartOfAccount::where('code', '5101')->where('is_active', true)->first();
            $inventoryAccount = ChartOfAccount::where('code', '1301')->where('is_active', true)->first();

            if (!$hppAccount || !$inventoryAccount) {
                Log::warning("Cannot adjust COGS for Sale #{$sale->id}: Accounts 5101 or 1301 not found.");
                return;
            }

            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => now(),
                'reference_type' => 'Sale', // Link to Sale so it builds up history
                'reference_id'   => $sale->id,
                'description'    => "Penyesuaian HPP (Reconciliasi Stok) Penjualan #{$sale->sale_number}",
                'status'         => 'posted',
            ]);

            if ($costDifference > 0) {
                // Cost Increased (Actual Cost > Estimated): Debit HPP, Credit Inventory
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $hppAccount->id,
                    'debit'               => $costDifference,
                    'credit'              => 0,
                    'description'         => "Penyesuaian HPP (Naik) #{$sale->sale_number}",
                ]);
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $inventoryAccount->id,
                    'debit'               => 0,
                    'credit'              => $costDifference,
                    'description'         => "Penyesuaian HPP (Naik) #{$sale->sale_number}",
                ]);
            } else {
                // Cost Decreased (Actual Cost < Estimated): Debit Inventory, Credit HPP
                $absDiff = abs($costDifference);
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $inventoryAccount->id,
                    'debit'               => $absDiff,
                    'credit'              => 0,
                    'description'         => "Penyesuaian HPP (Turun) #{$sale->sale_number}",
                ]);
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journalEntry->id,
                    'chart_of_account_id' => $hppAccount->id,
                    'debit'               => 0,
                    'credit'              => $absDiff,
                    'description'         => "Penyesuaian HPP (Turun) #{$sale->sale_number}",
                ]);
            }
        });
    }

    /**
     * Post overpayment refund to journal
     * Dr. Utang Lain-lain, Cr. Bank
     */
    public function postOverpaymentRefund($transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $transaction->loadMissing(['salePayment', 'bank.chartOfAccount']);

            // Get "Utang Lain-lain" account (2105)
            $otherPayableAccount = ChartOfAccount::where('code', '2105')
                ->where('is_active', true)
                ->first();

            if (!$otherPayableAccount) {
                $otherPayableAccount = ChartOfAccount::where('type', 'liability')
                    ->where('is_active', true)
                    ->where('code', 'like', '2%')
                    ->orderBy('code', 'desc')
                    ->first();
            }

            if (!$otherPayableAccount) {
                throw new \Exception('Akun Utang Lain-lain tidak ditemukan. Pastikan akun 2105 sudah ada.');
            }

            if (!$transaction->bank || !$transaction->bank->chartOfAccount) {
                throw new \Exception('Bank account tidak ditemukan untuk refund.');
            }

            // Create journal entry
            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date' => $transaction->transaction_date,
                'reference_type' => 'OverpaymentTransaction',
                'reference_id' => $transaction->id,
                'description' => "Pengembalian Kelebihan Pembayaran #{$transaction->transaction_number}",
                'status' => 'posted',
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Debit: Utang Lain-lain
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $otherPayableAccount->id,
                'debit' => $transaction->amount,
                'credit' => 0,
                'description' => "Pengembalian kelebihan pembayaran",
            ]);

            // Credit: Bank
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $transaction->bank->chartOfAccount->id,
                'debit' => 0,
                'credit' => $transaction->amount,
                'description' => "Pengembalian kelebihan pembayaran",
            ]);

            // Update bank balance (decrease)
            app(\App\Services\CashMovementService::class)->createMovement(
                $transaction->bank,
                'OverpaymentRefund',
                $transaction->id,
                $transaction->transaction_date,
                0,
                (float) $transaction->amount,
                "Pengembalian Kelebihan Pembayaran #{$transaction->transaction_number}"
            );

            // Update transaction with journal entry reference
            $transaction->update(['journal_entry_id' => $journalEntry->id]);
        });
    }

    /**
     * Post overpayment to income conversion to journal
     * Dr. Utang Lain-lain, Cr. Pendapatan Lain-lain
     */
    public function postOverpaymentToIncome($transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $transaction->loadMissing('salePayment');

            // Get "Utang Lain-lain" account (2105)
            $otherPayableAccount = ChartOfAccount::where('code', '2105')
                ->where('is_active', true)
                ->first();

            if (!$otherPayableAccount) {
                $otherPayableAccount = ChartOfAccount::where('type', 'liability')
                    ->where('is_active', true)
                    ->where('code', 'like', '2%')
                    ->orderBy('code', 'desc')
                    ->first();
            }

            if (!$otherPayableAccount) {
                throw new \Exception('Akun Utang Lain-lain tidak ditemukan. Pastikan akun 2105 sudah ada.');
            }

            // Get "Pendapatan Lain-lain" account (4103)
            $otherIncomeAccount = ChartOfAccount::where('code', '4103')
                ->where('is_active', true)
                ->first();

            if (!$otherIncomeAccount) {
                // Try to find any other income account
                $otherIncomeAccount = ChartOfAccount::where('type', 'income')
                    ->where('is_active', true)
                    ->where('code', 'like', '4%')
                    ->orderBy('code')
                    ->first();
            }

            if (!$otherIncomeAccount) {
                throw new \Exception('Akun Pendapatan Lain-lain tidak ditemukan. Pastikan akun 4103 sudah ada.');
            }

            // Create journal entry
            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date' => $transaction->transaction_date,
                'reference_type' => 'OverpaymentTransaction',
                'reference_id' => $transaction->id,
                'description' => "Konversi Kelebihan Pembayaran ke Pendapatan #{$transaction->transaction_number}",
                'status' => 'posted',
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Debit: Utang Lain-lain
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $otherPayableAccount->id,
                'debit' => $transaction->amount,
                'credit' => 0,
                'description' => "Konversi kelebihan pembayaran ke pendapatan",
            ]);

            // Credit: Pendapatan Lain-lain
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $otherIncomeAccount->id,
                'debit' => 0,
                'credit' => $transaction->amount,
                'description' => "Pendapatan dari kelebihan pembayaran pelanggan",
            ]);

            // Update transaction with journal entry reference
            $transaction->update(['journal_entry_id' => $journalEntry->id]);
        });
    }

    /**
     * Post purchase overpayment refund to journal (received from supplier)
     * Dr. Bank, Cr. Uang Muka Pembelian
     */
    public function postPurchaseOverpaymentRefund($transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $transaction->loadMissing(['purchasePayment', 'bank.chartOfAccount']);

            // Get "Uang Muka Pembelian" account (1401)
            $advanceAccount = ChartOfAccount::where('code', '1401')
                ->where('is_active', true)
                ->first();

            if (!$advanceAccount) {
                // Try to find any other asset account that might be used
                $advanceAccount = ChartOfAccount::where('type', 'asset')
                    ->where('is_active', true)
                    ->where('code', 'like', '1%')
                    ->orderBy('code', 'desc')
                    ->first();
            }

            if (!$advanceAccount) {
                throw new \Exception('Akun Uang Muka Pembelian tidak ditemukan. Pastikan akun 1401 sudah ada.');
            }

            if (!$transaction->bank || !$transaction->bank->chartOfAccount) {
                throw new \Exception('Bank account tidak ditemukan untuk refund.');
            }

            // Create journal entry
            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date' => $transaction->transaction_date,
                'reference_type' => 'OverpaymentTransaction',
                'reference_id' => $transaction->id,
                'description' => "Penerimaan Kembali Kelebihan Pembayaran #{$transaction->transaction_number}",
                'status' => 'posted',
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Debit: Bank
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $transaction->bank->chartOfAccount->id,
                'debit' => $transaction->amount,
                'credit' => 0,
                'description' => "Pengembalian kelebihan pembayaran dari supplier",
            ]);

            // Credit: Uang Muka Pembelian
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $advanceAccount->id,
                'debit' => 0,
                'credit' => $transaction->amount,
                'description' => "Penerimaan kembali uang muka ",
            ]);

            // Update bank balance (increase)
            app(\App\Services\CashMovementService::class)->createMovement(
                $transaction->bank,
                'OverpaymentRefund',
                $transaction->id,
                $transaction->transaction_date,
                (float) $transaction->amount,
                0,
                "Pengembalian Kelebihan Pembayaran #{$transaction->transaction_number}"
            );

            // Update transaction with journal entry reference
            $transaction->update(['journal_entry_id' => $journalEntry->id]);
        });
    }

    /**
     * Post purchase overpayment write-off to journal (loss)
     * Dr. Beban Lain-lain, Cr. Uang Muka Pembelian
     */
    public function postPurchaseOverpaymentWriteOff($transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $transaction->loadMissing('purchasePayment');

            // Get "Uang Muka Pembelian" account (1401)
            $advanceAccount = ChartOfAccount::where('code', '1401')
                ->where('is_active', true)
                ->first();

            if (!$advanceAccount) {
                $advanceAccount = ChartOfAccount::where('type', 'asset')
                    ->where('is_active', true)
                    ->where('code', 'like', '1%')
                    ->orderBy('code', 'desc')
                    ->first();
            }

            if (!$advanceAccount) {
                throw new \Exception('Akun Uang Muka Pembelian tidak ditemukan. Pastikan akun 1401 sudah ada.');
            }

            // Get "Beban Lain-Lain" account (7103)
            $expenseAccount = ChartOfAccount::where('code', '7103')
                ->where('is_active', true)
                ->first();

            if (!$expenseAccount) {
                // Try to find any other expense account
                $expenseAccount = ChartOfAccount::where('type', 'expense')
                    ->where('is_active', true)
                    ->where('code', 'like', '7%')
                    ->orderBy('code', 'desc')
                    ->first();
            }

            if (!$expenseAccount) {
                throw new \Exception('Akun Beban Lain-Lain tidak ditemukan. Pastikan akun 7103 sudah ada.');
            }

            // Create journal entry
            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date' => $transaction->transaction_date,
                'reference_type' => 'OverpaymentTransaction',
                'reference_id' => $transaction->id,
                'description' => "Penghapusan Kelebihan Pembayaran #{$transaction->transaction_number}",
                'status' => 'posted',
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Debit: Beban Lain-Lain
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $expenseAccount->id,
                'debit' => $transaction->amount,
                'credit' => 0,
                'description' => "Penghapusan kelebihan pembayaran (kerugian)",
            ]);

            // Credit: Uang Muka Pembelian
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $advanceAccount->id,
                'debit' => 0,
                'credit' => $transaction->amount,
                'description' => "Penghapusan uang muka yang tidak tertagih",
            ]);

            // Update transaction with journal entry reference
            $transaction->update(['journal_entry_id' => $journalEntry->id]);
        });
    }

    /**
     * Reverse any generic journal entry
     */
    public function reverseJournalEntry(JournalEntry $journalEntry): JournalEntry
    {
        return DB::transaction(function () use ($journalEntry) {
            if ($journalEntry->status !== 'posted') {
                throw new \Exception('Hanya jurnal dengan status Posted yang dapat dibalik.');
            }

            // Create reversal entry
            $reversalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date'   => now(),
                'reference_type' => $journalEntry->reference_type,
                'reference_id'   => $journalEntry->reference_id,
                'description'    => "Pembalikan: " . ($journalEntry->description ?? $journalEntry->journal_number),
                'status'         => 'reversed',
                'reversed_by'    => $journalEntry->id,
                'created_by'     => auth()->id(),
            ]);

            // Reverse all details
            foreach ($journalEntry->details as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id'    => $reversalEntry->id,
                    'chart_of_account_id' => $detail->chart_of_account_id,
                    'debit'               => $detail->credit, // Swap debit and credit
                    'credit'              => $detail->debit,
                    'description'         => "Pembalikan: " . $detail->description,
                ]);
            }

            // Optional: Handle specialized reversal logic for certain reference types
            // For example, if it's a CashIn/CashOut/Transfer, we should also reverse the Cash Movement
            if (in_array($journalEntry->reference_type, ['CashIn', 'CashOut', 'Transfer', \App\Models\Transfer::class])) {
                $referenceType = $journalEntry->reference_type;
                // Normalize reference type if it's a class string
                if ($referenceType === \App\Models\Transfer::class) {
                    $referenceType = 'Transfer';
                }

                $movements = \App\Models\CashMovement::where('reference_type', $journalEntry->reference_type)
                    ->where('reference_id', $journalEntry->reference_id)
                    ->get();
                
                foreach ($movements as $cashMovement) {
                    app(\App\Services\CashMovementService::class)->reverseMovement($cashMovement);
                }
            }

            // Update original journal entry status to reversed
            $journalEntry->update(['status' => 'reversed']);

            return $reversalEntry;
        });
    }
}

