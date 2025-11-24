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
                throw new \Exception('Bank atau Chart of Account tidak ditemukan');
            }

            // Get bank's chart of account
            $bankAccount = $cashIn->bank->chart_of_account_id;
            if (!$bankAccount) {
                throw new \Exception('Bank tidak memiliki Chart of Account yang terkait');
            }

            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date' => $cashIn->cash_in_date,
                'reference_type' => 'CashIn',
                'reference_id' => $cashIn->id,
                'description' => "Kas Masuk #{$cashIn->cash_in_number}: {$cashIn->description}",
                'status' => 'posted',
            ]);

            // Debit: Bank/Cash Account
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $bankAccount,
                'debit' => $cashIn->amount,
                'credit' => 0,
                'description' => "Kas Masuk #{$cashIn->cash_in_number}",
            ]);

            // Credit: Income Account
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $cashIn->chart_of_account_id,
                'debit' => 0,
                'credit' => $cashIn->amount,
                'description' => "Kas Masuk #{$cashIn->cash_in_number}",
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
                    throw new \Exception('Bank tidak memiliki Chart of Account yang terkait');
                }
            }

            $journalEntry = JournalEntry::create([
                'journal_number' => JournalEntry::generateJournalNumber(),
                'journal_date' => $cashOut->cash_out_date,
                'reference_type' => 'CashOut',
                'reference_id' => $cashOut->id,
                'description' => "Kas Keluar #{$cashOut->cash_out_number}: {$cashOut->description}",
                'status' => 'posted',
            ]);

            // Debit: Chart of Account (bisa Hutang Usaha untuk pembayaran pembelian, atau Expense untuk lainnya)
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $cashOut->chart_of_account_id,
                'debit' => $cashOut->amount,
                'credit' => 0,
                'description' => "Kas Keluar #{$cashOut->cash_out_number}",
            ]);

            // Credit: Bank/Cash Account
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $bankAccount,
                'debit' => 0,
                'credit' => $cashOut->amount,
                'description' => "Kas Keluar #{$cashOut->cash_out_number}",
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
                'journal_date' => now(),
                'reference_type' => 'CashIn',
                'reference_id' => $cashIn->id,
                'description' => "Pembalikan Kas Masuk #{$cashIn->cash_in_number}",
                'status' => 'reversed',
                'reversed_by' => $journalEntry->id,
            ]);

            // Reverse all details
            foreach ($journalEntry->details as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id' => $reversalEntry->id,
                    'chart_of_account_id' => $detail->chart_of_account_id,
                    'debit' => $detail->credit, // Swap debit and credit
                    'credit' => $detail->debit,
                    'description' => "Pembalikan: {$detail->description}",
                ]);
            }

            // Delete cash movement and recalculate balances
            $cashMovement = \App\Models\CashMovement::where('reference_type', 'CashIn')
                ->where('reference_id', $cashIn->id)
                ->first();

            if ($cashMovement) {
                app(\App\Services\CashMovementService::class)->deleteMovement($cashMovement);
            }

            // Update journal entry status
            $journalEntry->update(['status' => 'reversed']);

            // Update cash in status
            $cashIn->update(['status' => 'draft']);
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
                'journal_date' => now(),
                'reference_type' => 'CashOut',
                'reference_id' => $cashOut->id,
                'description' => "Pembalikan Kas Keluar #{$cashOut->cash_out_number}",
                'status' => 'reversed',
                'reversed_by' => $journalEntry->id,
            ]);

            // Reverse all details
            foreach ($journalEntry->details as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id' => $reversalEntry->id,
                    'chart_of_account_id' => $detail->chart_of_account_id,
                    'debit' => $detail->credit, // Swap debit and credit
                    'credit' => $detail->debit,
                    'description' => "Pembalikan: {$detail->description}",
                ]);
            }

            // Delete cash movement and recalculate balances
            $cashMovement = \App\Models\CashMovement::where('reference_type', 'CashOut')
                ->where('reference_id', $cashOut->id)
                ->first();

            if ($cashMovement) {
                app(\App\Services\CashMovementService::class)->deleteMovement($cashMovement);
            }

            // Update journal entry status
            $journalEntry->update(['status' => 'reversed']);

            // Update cash out status
            $cashOut->update(['status' => 'draft']);
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
                'journal_date' => $sale->sale_date,
                'reference_type' => 'Sale',
                'reference_id' => $sale->id,
                'description' => "Penjualan #{$sale->sale_number}",
                'status' => 'posted',
            ]);

            // Debit: Piutang Usaha (total amount termasuk PPN)
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $receivableAccount->id,
                'debit' => $sale->total_amount,
                'credit' => 0,
                'description' => "Piutang dari Penjualan #{$sale->sale_number}",
            ]);

            // Credit: Pendapatan Penjualan (hanya total setelah diskon, tanpa PPN)
            $incomeAmount = (float) $sale->total_after_discount;
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $incomeAccount->id,
                'debit' => 0,
                'credit' => $incomeAmount,
                'description' => "Pendapatan dari Penjualan #{$sale->sale_number}",
            ]);

            // Credit: Pajak Keluaran (jika ada PPN)
            $ppnAmount = (float) ($sale->ppn_amount ?? 0);
            if ($ppnAmount > 0 && $taxAccount) {
                JournalEntryDetail::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $taxAccount->id,
                    'debit' => 0,
                    'credit' => $ppnAmount,
                    'description' => "PPN Keluaran dari Penjualan #{$sale->sale_number}",
                ]);
            }

            // Debit: HPP
            if ($sale->total_cost > 0) {
                JournalEntryDetail::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $hppAccount->id,
                    'debit' => $sale->total_cost,
                    'credit' => 0,
                    'description' => "HPP Penjualan #{$sale->sale_number}",
                ]);

                // Credit: Persediaan
                JournalEntryDetail::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $inventoryAccount->id,
                    'debit' => 0,
                    'credit' => $sale->total_cost,
                    'description' => "Pengurangan Persediaan dari Penjualan #{$sale->sale_number}",
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
                'journal_date' => now(),
                'reference_type' => 'Sale',
                'reference_id' => $sale->id,
                'description' => "Pembalikan Penjualan #{$sale->sale_number}",
                'status' => 'reversed',
                'reversed_by' => $journalEntry->id,
            ]);

            // Reverse all details
            foreach ($journalEntry->details as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id' => $reversalEntry->id,
                    'chart_of_account_id' => $detail->chart_of_account_id,
                    'debit' => $detail->credit, // Swap debit and credit
                    'credit' => $detail->debit,
                    'description' => "Pembalikan: {$detail->description}",
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
                'journal_date' => $purchase->purchase_date,
                'reference_type' => 'Purchase',
                'reference_id' => $purchase->id,
                'description' => "Pembelian #{$purchase->purchase_number}",
                'status' => 'posted',
            ]);

            // Debit: Persediaan (hanya total setelah diskon, tanpa PPN)
            $inventoryAmount = (float) $purchase->total_after_discount;
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $inventoryAccount->id,
                'debit' => $inventoryAmount,
                'credit' => 0,
                'description' => "Penambahan Persediaan dari Pembelian #{$purchase->purchase_number}",
            ]);

            // Debit: Pajak Masukan (jika ada PPN)
            $ppnAmount = (float) ($purchase->ppn_amount ?? 0);
            if ($ppnAmount > 0 && $taxAccount) {
                JournalEntryDetail::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $taxAccount->id,
                    'debit' => $ppnAmount,
                    'credit' => 0,
                    'description' => "PPN Masukan dari Pembelian #{$purchase->purchase_number}",
                ]);
            }

            // Credit: Hutang Usaha (total amount termasuk PPN)
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $payableAccount->id,
                'debit' => 0,
                'credit' => $purchase->total_amount,
                'description' => "Hutang dari Pembelian #{$purchase->purchase_number}",
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
                'journal_date' => now(),
                'reference_type' => 'Purchase',
                'reference_id' => $purchase->id,
                'description' => "Pembalikan Pembelian #{$purchase->purchase_number}",
                'status' => 'reversed',
                'reversed_by' => $journalEntry->id,
            ]);

            // Reverse all details
            foreach ($journalEntry->details as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id' => $reversalEntry->id,
                    'chart_of_account_id' => $detail->chart_of_account_id,
                    'debit' => $detail->credit, // Swap debit and credit
                    'credit' => $detail->debit,
                    'description' => "Pembalikan: {$detail->description}",
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
                throw new \Exception('Bank tidak memiliki Chart of Account yang terkait');
            }

            $newBalance = (float) $bank->balance;
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
                'journal_date' => now(),
                'reference_type' => 'Bank',
                'reference_id' => $bank->id,
                'description' => "Saldo Awal " . ($bank->type === 'cash' ? 'Kas' : 'Bank') . ": {$bank->name}",
                'status' => 'posted',
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
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $bank->chart_of_account_id,
                    'debit' => $balanceDifference,
                    'credit' => 0,
                    'description' => "Saldo Awal {$bank->name}",
                ]);

                JournalEntryDetail::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $equityAccount->id,
                    'debit' => 0,
                    'credit' => $balanceDifference,
                    'description' => "Saldo Awal {$bank->name}",
                ]);
            } else {
                // Saldo berkurang: Debit Modal, Credit Bank
                JournalEntryDetail::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $equityAccount->id,
                    'debit' => abs($balanceDifference),
                    'credit' => 0,
                    'description' => "Penyesuaian Saldo {$bank->name}",
                ]);

                JournalEntryDetail::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $bank->chart_of_account_id,
                    'debit' => 0,
                    'credit' => abs($balanceDifference),
                    'description' => "Penyesuaian Saldo {$bank->name}",
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
                'journal_date' => now(),
                'reference_type' => 'Item',
                'reference_id' => $item->id,
                'description' => "Stok Awal Barang: {$item->name} ({$item->code})",
                'status' => 'posted',
            ]);

            // Debit: Persediaan
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $inventoryAccount->id,
                'debit' => $totalCost,
                'credit' => 0,
                'description' => "Stok Awal {$item->name}",
            ]);

            // Credit: Modal
            JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $equityAccount->id,
                'debit' => 0,
                'credit' => $totalCost,
                'description' => "Stok Awal {$item->name}",
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

            $quantity = (float) $stockMovement->quantity;
            $unitCost = (float) $stockMovement->unit_cost;
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
                'journal_date' => $stockMovement->movement_date,
                'reference_type' => 'StockAdjustment',
                'reference_id' => $stockMovement->id,
                'description' => "Penyesuaian Stok: {$stockMovement->item->name} ({$stockMovement->item->code}) - {$stockMovement->notes}",
                'status' => 'posted',
            ]);

            if ($quantity > 0) {
                // Increase stock: Debit Persediaan, Credit Modal
                JournalEntryDetail::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $inventoryAccount->id,
                    'debit' => $totalAmount,
                    'credit' => 0,
                    'description' => "Penambahan Persediaan: {$stockMovement->item->name}",
                ]);

                JournalEntryDetail::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $equityAccount->id,
                    'debit' => 0,
                    'credit' => $totalAmount,
                    'description' => "Penyesuaian Stok: {$stockMovement->item->name}",
                ]);
            } else {
                // Decrease stock: Debit HPP/Penyesuaian, Credit Persediaan
                JournalEntryDetail::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $adjustmentAccount->id,
                    'debit' => $totalAmount,
                    'credit' => 0,
                    'description' => "Pengurangan Persediaan: {$stockMovement->item->name}",
                ]);

                JournalEntryDetail::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $inventoryAccount->id,
                    'debit' => 0,
                    'credit' => $totalAmount,
                    'description' => "Penyesuaian Stok: {$stockMovement->item->name}",
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
                'journal_date' => now(),
                'reference_type' => 'StockAdjustment',
                'reference_id' => $stockMovement->id,
                'description' => "Pembalikan Penyesuaian Stok: " . ($stockMovement->item->name ?? ''),
                'status' => 'reversed',
                'reversed_by' => $journalEntry->id,
            ]);

            // Reverse all details
            foreach ($journalEntry->details as $detail) {
                JournalEntryDetail::create([
                    'journal_entry_id' => $reversalEntry->id,
                    'chart_of_account_id' => $detail->chart_of_account_id,
                    'debit' => $detail->credit,
                    'credit' => $detail->debit,
                    'description' => "Pembalikan: {$detail->description}",
                ]);
            }

            // Update journal entry status
            $journalEntry->update(['status' => 'reversed']);
        });
    }
}

