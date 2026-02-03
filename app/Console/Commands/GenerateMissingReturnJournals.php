<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateMissingReturnJournals extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pos:generate-missing-return-journals';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate missing accounting journal entries for existing confirmed purchase and sale returns.';

    /**
     * Execute the console command.
     */
    public function handle(\App\Services\JournalService $journalService)
    {
        $this->info('Checking for missing Purchase Return journals...');

        $pReturns = \App\Models\PurchaseReturn::where('status', 'confirmed')
            ->whereNotExists(function ($query) {
                $query->select(\Illuminate\Support\Facades\DB::raw(1))
                    ->from('journal_entries')
                    ->where('reference_type', 'PurchaseReturn')
                    ->whereColumn('reference_id', 'purchase_returns.id');
            })->get();

        $this->info("Found {$pReturns->count()} missing purchase return journals.");

        foreach ($pReturns as $pr) {
            try {
                $journalService->postPurchaseReturn($pr);
                $this->line("Generated journal for Purchase Return #{$pr->return_number}");
            } catch (\Exception $e) {
                $this->error("Failed to generate journal for Purchase Return #{$pr->return_number}: " . $e->getMessage());
            }
        }

        $this->info('---');
        $this->info('Checking for missing Sale Return journals...');

        $sReturns = \App\Models\SaleReturn::where('status', 'confirmed')
            ->whereNotExists(function ($query) {
                $query->select(\Illuminate\Support\Facades\DB::raw(1))
                    ->from('journal_entries')
                    ->where('reference_type', 'SaleReturn')
                    ->whereColumn('reference_id', 'sale_returns.id');
            })->get();

        $this->info("Found {$sReturns->count()} missing sale return journals.");

        foreach ($sReturns as $sr) {
            try {
                $journalService->postSaleReturn($sr);
                $this->line("Generated journal for Sale Return #{$sr->return_number}");
            } catch (\Exception $e) {
                $this->error("Failed to generate journal for Sale Return #{$sr->return_number}: " . $e->getMessage());
            }
        }

        $this->info('Done!');
    }
}
