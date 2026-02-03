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
                // Generate main return journal
                $journalService->postPurchaseReturn($pr);
                
                // If cash refund, also generate CashIn and its journal
                if ($pr->refund_method === 'cash_refund' && $pr->refund_bank_id) {
                    $payableAccount = \App\Models\ChartOfAccount::where('code', '2101')->where('is_active', true)->first();
                    
                    $cashIn = \App\Models\CashIn::create([
                        'cash_in_number'      => \App\Models\CashIn::generateCashInNumber(),
                        'cash_in_date'        => $pr->return_date,
                        'bank_id'             => $pr->refund_bank_id,
                        'chart_of_account_id' => $payableAccount ? $payableAccount->id : null,
                        'amount'              => $pr->total_amount,
                        'description'         => "Refund dari Retur Pembelian #{$pr->return_number} (Backfill)",
                        'status'              => 'posted',
                        'reference_type'      => 'PurchaseReturn',
                        'reference_id'        => $pr->id,
                        'created_by'          => auth()->id() ?? 1,
                        'updated_by'          => auth()->id() ?? 1,
                    ]);

                    $journalService->postCashIn($cashIn);
                    $this->line("Generated CashIn for Purchase Return #{$pr->return_number}");
                }

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
                // Generate main return journal
                $journalService->postSaleReturn($sr);

                // If cash refund, also generate CashOut and its journal
                if ($sr->refund_method === 'cash_refund' && $sr->refund_bank_id) {
                    $receivableAccount = \App\Models\ChartOfAccount::where('code', '1201')->where('is_active', true)->first();

                    $cashOut = \App\Models\CashOut::create([
                        'cash_out_number'     => \App\Models\CashOut::generateCashOutNumber(),
                        'cash_out_date'       => $sr->return_date,
                        'bank_id'             => $sr->refund_bank_id,
                        'chart_of_account_id' => $receivableAccount ? $receivableAccount->id : null,
                        'amount'              => $sr->total_amount,
                        'description'         => "Pengembalian Dana Retur Penjualan #{$sr->return_number} (Backfill)",
                        'status'              => 'posted',
                        'reference_type'      => 'SaleReturn',
                        'reference_id'        => $sr->id,
                        'created_by'          => auth()->id() ?? 1,
                        'updated_by'          => auth()->id() ?? 1,
                    ]);

                    $journalService->postCashOut($cashOut);
                    $this->line("Generated CashOut for Sale Return #{$sr->return_number}");
                }

                $this->line("Generated journal for Sale Return #{$sr->return_number}");
            } catch (\Exception $e) {
                $this->error("Failed to generate journal for Sale Return #{$sr->return_number}: " . $e->getMessage());
            }
        }

        $this->info('Done!');
    }
}
