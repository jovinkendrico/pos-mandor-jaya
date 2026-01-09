<?php

namespace App\Services;

use App\Models\Bank;
use App\Models\CashMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CashMovementService
{
    /**
     * Create a cash movement record and update bank balance
     * 
     * @param Bank $bank
     * @param string $referenceType (CashIn, CashOut, SalePayment, PurchasePayment, Bank, etc.)
     * @param int|null $referenceId
     * @param \Carbon\Carbon|string $movementDate
     * @param float $debit Amount masuk (0 if credit)
     * @param float $credit Amount keluar (0 if debit)
     * @param string|null $description
     * @return CashMovement
     */
    public function createMovement(
        Bank $bank,
        string $referenceType,
        ?int $referenceId,
        $movementDate,
        float $debit = 0,
        float $credit = 0,
        ?string $description = null
    ): CashMovement {
        return DB::transaction(function () use ($bank, $referenceType, $referenceId, $movementDate, $debit, $credit, $description) {
            // For opening balance (Bank reference), balance should equal the debit/credit amount
            // because this represents the initial balance, not an addition to existing balance
            if ($referenceType === 'Bank') {
                // Opening balance - balance equals the debit amount (or negative credit)
                $newBalance = $debit > 0 ? $debit : (0 - $credit);
            } else {
                // Get current balance from the last cash movement or initial balance
                $lastMovement = CashMovement::where('bank_id', $bank->id)
                    ->orderBy('movement_date', 'desc')
                    ->orderBy('id', 'desc')
                    ->lockForUpdate()
                    ->first();

                // Calculate from last movement or initial balance
                $currentBalance = $lastMovement 
                    ? (float) $lastMovement->balance 
                    : (float) ($bank->initial_balance ?? 0);

                // Calculate new balance
                $newBalance = $currentBalance + $debit - $credit;
            }

            // Create cash movement record
            $cashMovement = CashMovement::create([
                'bank_id' => $bank->id,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'movement_date' => is_string($movementDate) ? $movementDate : $movementDate->format('Y-m-d'),
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $newBalance,
                'description' => $description,
            ]);

            // Update bank balance
            $bank->update(['balance' => $newBalance]);

            return $cashMovement;
        });
    }

    /**
     * Delete a cash movement and recalculate balances
     * 
     * @param CashMovement $cashMovement
     * @return void
     */
    public function deleteMovement(CashMovement $cashMovement): void
    {
        DB::transaction(function () use ($cashMovement) {
            $bank = $cashMovement->bank;
            
            // Delete the movement
            $cashMovement->delete();

            // Recalculate all balances after this movement
            $this->recalculateBalances($bank, $cashMovement->movement_date);
        });
    }

    /**
     * Reverse a cash movement by creating a new opposing movement
     * 
     * @param CashMovement $movement
     * @param \Carbon\Carbon|string|null $reversalDate
     * @return CashMovement
     */
    public function reverseMovement(CashMovement $movement, $reversalDate = null): CashMovement
    {
        return DB::transaction(function () use ($movement, $reversalDate) {
            $date = $reversalDate ?? now();
            
            // Create reversal record
            // Debit becomes Credit, Credit becomes Debit
            $reversal = CashMovement::create([
                'bank_id' => $movement->bank_id,
                'reference_type' => $movement->reference_type,
                'reference_id' => $movement->reference_id,
                'movement_date' => is_string($date) ? $date : $date->format('Y-m-d'),
                'debit' => $movement->credit, 
                'credit' => $movement->debit,
                'balance' => 0, // Will be calculated
                'description' => "Pembalikan: " . $movement->description,
            ]);
            
            // Recalculate balances from the reversal date
            $this->recalculateBalances($movement->bank, $date);
            
            return $reversal;
        });
    }

    /**
     * Recalculate balances for all movements after a given date
     * 
     * @param Bank $bank
     * @param string|\Carbon\Carbon $fromDate
     * @return void
     */
    public function recalculateBalances(Bank $bank, $fromDate): void
    {
        DB::transaction(function () use ($bank, $fromDate) {
            $date = is_string($fromDate) ? $fromDate : $fromDate->format('Y-m-d');

            // Get balance before the fromDate
            $lastMovementBefore = CashMovement::where('bank_id', $bank->id)
                ->where('movement_date', '<', $date)
                ->orderBy('movement_date', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            $startingBalance = $lastMovementBefore 
                ? (float) $lastMovementBefore->balance 
                : (float) ($bank->initial_balance ?? 0);

            // Get all movements from the fromDate onwards
            $movements = CashMovement::where('bank_id', $bank->id)
                ->where('movement_date', '>=', $date)
                ->orderBy('movement_date', 'asc')
                ->orderBy('id', 'asc')
                ->lockForUpdate()
                ->get();

            $runningBalance = $startingBalance;

            foreach ($movements as $movement) {
                // For opening balance (Bank reference), balance should equal the debit amount
                // because this represents the initial balance, not an addition
                if ($movement->reference_type === 'Bank') {
                    $runningBalance = $movement->debit > 0 ? (float) $movement->debit : (0 - (float) $movement->credit);
                } else {
                    $runningBalance = $runningBalance + (float) $movement->debit - (float) $movement->credit;
                }
                $movement->update(['balance' => $runningBalance]);
            }

            // Update bank balance to the last calculated balance
            $lastMovement = CashMovement::where('bank_id', $bank->id)
                ->orderBy('movement_date', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            $finalBalance = $lastMovement 
                ? (float) $lastMovement->balance 
                : (float) ($bank->initial_balance ?? 0);

            $bank->update(['balance' => $finalBalance]);
        });
    }
}

