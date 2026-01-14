<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CompareProfitSalesVsJournal extends Command
{
    protected $signature = 'sales:compare-profit-journal';
    protected $description = 'Compare profit from sales table vs journal entries';

    public function handle()
    {
        $this->info('=== Comparing Profit: Sales Table vs Journal ===');
        $this->newLine();

        // 1. Get total profit from sales table
        $salesProfit = DB::table('sales')
            ->where('status', 'confirmed')
            ->sum('total_profit');

        $this->info("Total Profit from Sales Table: " . number_format($salesProfit, 2));
        $this->newLine();

        // 2. Get revenue from journal (account 4xxx - Revenue)
        $revenue = DB::table('journal_entry_details')
            ->join('chart_of_accounts', 'journal_entry_details.chart_of_account_id', '=', 'chart_of_accounts.id')
            ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('chart_of_accounts.code', 'like', '4%')
            ->whereNull('journal_entries.deleted_at')
            ->selectRaw('SUM(journal_entry_details.credit) - SUM(journal_entry_details.debit) as total')
            ->value('total') ?? 0;

        $this->info("Total Revenue from Journal (4xxx): " . number_format($revenue, 2));

        // 3. Get COGS from journal (account 5101 - HPP)
        $cogs = DB::table('journal_entry_details')
            ->join('chart_of_accounts', 'journal_entry_details.chart_of_account_id', '=', 'chart_of_accounts.id')
            ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
            ->where('chart_of_accounts.code', '=', '5101')
            ->whereNull('journal_entries.deleted_at')
            ->selectRaw('SUM(journal_entry_details.debit) - SUM(journal_entry_details.credit) as total')
            ->value('total') ?? 0;

        $this->info("Total COGS from Journal (5101): " . number_format($cogs, 2));
        $this->newLine();

        // 4. Calculate profit from journal
        $journalProfit = $revenue - $cogs;
        $this->info("Total Profit from Journal (Revenue - COGS): " . number_format($journalProfit, 2));
        $this->newLine();

        // 5. Compare
        $difference = $salesProfit - $journalProfit;
        
        $this->table(
            ['Source', 'Amount'],
            [
                ['Sales Table (total_profit)', number_format($salesProfit, 2)],
                ['Journal (Revenue - COGS)', number_format($journalProfit, 2)],
                ['Difference', number_format($difference, 2)],
            ]
        );

        if (abs($difference) < 0.01) {
            $this->info("\n✓ Profit matches! No discrepancy.");
        } else {
            $this->error("\n✗ Profit MISMATCH! Difference: " . number_format($difference, 2));
            $this->newLine();
            
            // Find potential causes
            $this->info("Investigating potential causes...");
            $this->newLine();

            // Check for sales without journal entries
            $salesWithoutJournal = DB::table('sales')
                ->leftJoin('journal_entries', function($join) {
                    $join->on('sales.id', '=', 'journal_entries.reference_id')
                         ->where('journal_entries.reference_type', '=', 'Sale');
                })
                ->whereNull('journal_entries.id')
                ->where('sales.status', 'confirmed')
                ->count();

            if ($salesWithoutJournal > 0) {
                $this->warn("Found {$salesWithoutJournal} confirmed sales without journal entries!");
            }

            // Check for journal adjustments related to COGS
            $this->info("\nRecent COGS Adjustments:");
            $recentAdjustments = DB::table('journal_entry_details')
                ->join('journal_entries', 'journal_entry_details.journal_entry_id', '=', 'journal_entries.id')
                ->join('chart_of_accounts', 'journal_entry_details.chart_of_account_id', '=', 'chart_of_accounts.id')
                ->where('chart_of_accounts.code', '=', '5101')
                ->whereNull('journal_entries.deleted_at')
                ->where(function($q) {
                    $q->where('journal_entries.description', 'like', '%penyesuaian%')
                      ->orWhere('journal_entries.description', 'like', '%adjustment%')
                      ->orWhere('journal_entries.description', 'like', '%reconcil%');
                })
                ->orderBy('journal_entries.journal_date', 'desc')
                ->limit(10)
                ->get(['journal_entries.journal_number', 'journal_entries.journal_date', 'journal_entry_details.debit', 'journal_entry_details.credit', 'journal_entries.description']);

            if ($recentAdjustments->isNotEmpty()) {
                foreach ($recentAdjustments as $adj) {
                    $amount = $adj->debit > 0 ? $adj->debit : -$adj->credit;
                    $this->line(sprintf(
                        "  %s | %s | %s | %s",
                        $adj->journal_number,
                        $adj->journal_date,
                        number_format($amount, 2),
                        substr($adj->description, 0, 50)
                    ));
                }
            } else {
                $this->info("  No COGS adjustments found.");
            }
        }

        return 0;
    }
}
