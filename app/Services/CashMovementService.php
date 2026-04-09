<?php

namespace App\Services;

use App\Models\Bank;
use App\Models\CashMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CashMovementService
{
    public static $skipRecalculate = false;

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
            $formattedDate = is_string($movementDate) ? $movementDate : $movementDate->format('Y-m-d');

            // For opening balance (Bank reference), balance should equal the debit/credit amount
            if ($referenceType === 'Bank') {
                $newBalance = $debit > 0 ? $debit : (0 - $credit);
            } else {
                // Get last movement BEFORE this new movement date
                $lastMovementBefore = CashMovement::where('bank_id', $bank->id)
                    ->where('movement_date', '<=', $formattedDate)
                    ->orderBy('movement_date', 'desc')
                    ->orderBy('id', 'desc')
                    ->lockForUpdate()
                    ->first();

                $startingBalance = $lastMovementBefore 
                    ? (float) $lastMovementBefore->balance 
                    : (float) ($bank->initial_balance ?? 0);

                $newBalance = round($startingBalance + $debit - $credit, 2);
            }

            // Create cash movement record
            $cashMovement = CashMovement::create([
                'bank_id' => $bank->id,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'movement_date' => $formattedDate,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $newBalance,
                'description' => $description,
            ]);

            // Check if there are movements AFTER this date that need recalculation
            $hasFutureMovements = CashMovement::where('bank_id', $bank->id)
                ->where(function($q) use ($formattedDate, $cashMovement) {
                    $q->where('movement_date', '>', $formattedDate)
                      ->orWhere(function($q2) use ($formattedDate, $cashMovement) {
                          $q2->where('movement_date', $formattedDate)
                             ->where('id', '>', $cashMovement->id);
                      });
                })
                ->exists();

            if (self::$skipRecalculate) {
                return $cashMovement;
            }

            if ($hasFutureMovements) {
                $this->recalculateBalances($bank, $formattedDate);
            } else {
                // Just update bank balance if it's the latest
                $bank->update(['balance' => $newBalance]);
            }

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
            $date = $reversalDate ?? $movement->movement_date;
            
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
                    $runningBalance = round($movement->debit > 0 ? (float) $movement->debit : (0 - (float) $movement->credit), 2);
                } else {
                    $runningBalance = round($runningBalance + (float) $movement->debit - (float) $movement->credit, 2);
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

