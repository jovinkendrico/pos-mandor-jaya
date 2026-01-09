<?php

namespace App\Console\Commands;

use App\Models\Bank;
use App\Services\CashMovementService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RecalculateCashMovements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cash-movement:recalculate {--bank_id= : ID specific bank to recalculate (optional)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate balances for all cash movements based on chronological order';

    /**
     * Execute the console command.
     */
    public function handle(CashMovementService $cashMovementService)
    {
        $bankId = $this->option('bank_id');
        
        $query = Bank::query();
        if ($bankId) {
            $query->where('id', $bankId);
        }
        
        $banks = $query->orderBy('id')->get();
        
        if ($banks->isEmpty()) {
            $this->error('No banks found.');
            return 1;
        }

        $this->info("Found {$banks->count()} bank(s) to recalculate.");
        
        foreach ($banks as $bank) {
            $this->info("Recalculating for Bank: {$bank->name} (ID: {$bank->id})...");
            
            try {
                // Since user wants to recalculate ALL, we should pass a very old date.
                // Or just modify logic to recalculate from the beginning.
                // The service method recalculateBalances($bank, $fromDate)
                
                // Let's pass a very old date (e.g., 2000-01-01) or find the first movement date.
                $firstMovement = \App\Models\CashMovement::where('bank_id', $bank->id)
                    ->orderBy('movement_date', 'asc')
                    ->first();
                    
                $fromDate = $firstMovement ? $firstMovement->movement_date : now()->subYears(50);
                
                $cashMovementService->recalculateBalances($bank, $fromDate);
                
                $this->info("  -> Done. Current Balance: {$bank->fresh()->balance}");
            } catch (\Exception $e) {
                $this->error("  -> Error: {$e->getMessage()}");
            }
        }
        
        $this->info('Recalculation complete.');
        return 0;
    }
}
