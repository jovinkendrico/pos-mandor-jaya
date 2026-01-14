<?php

namespace App\Console\Commands;

use App\Models\Sale;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncSalesProfitFromJournal extends Command
{
    protected $signature = 'sales:sync-profit-from-journal 
                            {--dry-run : Run without making changes}
                            {--sale-number= : Sync specific sale number only}';

    protected $description = 'Sync sales profit with journal COGS adjustments';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $saleNumber = $this->option('sale-number');

        $this->info('=== Sync Sales Profit from Journal Adjustments ===');
        $this->info('Dry Run: ' . ($dryRun ? 'YES' : 'NO'));
        if ($saleNumber) {
            $this->info('Sale Number: ' . $saleNumber);
        }
        $this->newLine();

        // Find all COGS adjustment journal entries for sales
        $query = DB::table('journal_entries')
            ->where('reference_type', 'Sale')
            ->whereNull('deleted_at')
            ->where(function($q) {
                $q->where('description', 'like', '%penyesuaian%')
                  ->orWhere('description', 'like', '%adjustment%')
                  ->orWhere('description', 'like', '%reconcil%');
            });

        if ($saleNumber) {
            $query->where('description', 'like', "%#{$saleNumber}%");
        }

        $adjustmentJournals = $query->get();

        if ($adjustmentJournals->isEmpty()) {
            $this->warn('No adjustment journals found for sales.');
            return 0;
        }

        $this->info("Found {$adjustmentJournals->count()} adjustment journal entries");
        $this->newLine();

        $totalAdjusted = 0;
        $totalProfitDiff = 0;

        foreach ($adjustmentJournals as $journal) {
            // Get the sale
            $sale = Sale::find($journal->reference_id);
            
            if (!$sale) {
                $this->warn("Sale ID {$journal->reference_id} not found for journal {$journal->journal_number}");
                continue;
            }

            // Get COGS adjustment amount from journal_entry_details
            $cogsAdjustment = DB::table('journal_entry_details')
                ->join('chart_of_accounts', 'journal_entry_details.chart_of_account_id', '=', 'chart_of_accounts.id')
                ->where('journal_entry_details.journal_entry_id', $journal->id)
                ->where('chart_of_accounts.code', '5101') // HPP account
                ->selectRaw('SUM(debit) - SUM(credit) as adjustment')
                ->value('adjustment') ?? 0;

            if (abs($cogsAdjustment) < 0.01) {
                continue; // No significant adjustment
            }

            // COGS adjustment affects profit inversely
            // If COGS increases (positive), profit decreases (negative)
            // If COGS decreases (negative), profit increases (positive)
            $profitAdjustment = -$cogsAdjustment;

            $this->line(sprintf(
                "Sale #%s (ID: %d) | Journal: %s | COGS Adj: %s | Profit Adj: %s",
                $sale->sale_number,
                $sale->id,
                $journal->journal_number,
                number_format($cogsAdjustment, 2),
                number_format($profitAdjustment, 2)
            ));

            if (!$dryRun) {
                DB::transaction(function () use ($sale, $cogsAdjustment, $profitAdjustment, $journal) {
                    // Update sale
                    $sale->increment('total_cost', $cogsAdjustment);
                    $sale->increment('total_profit', $profitAdjustment);

                    Log::info('Synced sale profit from journal adjustment', [
                        'sale_id' => $sale->id,
                        'sale_number' => $sale->sale_number,
                        'journal_number' => $journal->journal_number,
                        'cogs_adjustment' => $cogsAdjustment,
                        'profit_adjustment' => $profitAdjustment,
                    ]);
                });
            }

            $totalAdjusted++;
            $totalProfitDiff += $profitAdjustment;
        }

        $this->newLine();
        $this->info("=== Summary ===");
        $this->info("Total Sales Adjusted: {$totalAdjusted}");
        $this->info("Total Profit Adjustment: " . number_format($totalProfitDiff, 2));

        if ($dryRun) {
            $this->warn("\nThis was a DRY RUN. No changes were made.");
            $this->warn("Run without --dry-run to apply changes.");
        } else {
            $this->info("\n✓ Changes applied successfully!");
            
            // Verify
            $this->newLine();
            $this->info("Verifying...");
            $this->call('sales:compare-profit-journal');
        }

        return 0;
    }
}
