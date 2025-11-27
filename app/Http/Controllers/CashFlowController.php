<?php

namespace App\Http\Controllers;

use App\Models\CashMovement;
use App\Models\Bank;
use App\Models\CashIn;
use App\Models\CashOut;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class CashFlowController extends Controller
{
    /**
     * Display cash flow report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get all banks
        $banks = Bank::orderBy('name')->get();

        $cashFlowData = [];
        $totalOpeningBalance = 0;
        $totalCashIn = 0;
        $totalCashOut = 0;
        $totalClosingBalance = 0;

        foreach ($banks as $bank) {
            // Get opening balance (before dateFrom)
            $openingBalance = $bank->initial_balance;
            $openingMovements = CashMovement::where('bank_id', $bank->id)
                ->where('movement_date', '<', $dateFrom)
                ->orderBy('movement_date', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            if ($openingMovements) {
                $openingBalance = $openingMovements->balance;
            }

            // Get cash in and cash out for period
            $cashIn = CashMovement::where('bank_id', $bank->id)
                ->whereBetween('movement_date', [$dateFrom, $dateTo])
                ->whereIn('reference_type', ['CashIn', 'Bank'])
                ->sum('debit');

            $cashOut = CashMovement::where('bank_id', $bank->id)
                ->whereBetween('movement_date', [$dateFrom, $dateTo])
                ->where('reference_type', 'CashOut')
                ->sum('credit');

            // Get closing balance
            $closingMovements = CashMovement::where('bank_id', $bank->id)
                ->where('movement_date', '<=', $dateTo)
                ->orderBy('movement_date', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            $closingBalance = $openingBalance;
            if ($closingMovements) {
                $closingBalance = $closingMovements->balance;
            } else {
                $closingBalance = $openingBalance + $cashIn - $cashOut;
            }

            $netCashFlow = $cashIn - $cashOut;

            $totalOpeningBalance += $openingBalance;
            $totalCashIn += $cashIn;
            $totalCashOut += $cashOut;
            $totalClosingBalance += $closingBalance;

            $cashFlowData[] = [
                'bank_id' => $bank->id,
                'bank_name' => $bank->name,
                'bank_type' => $bank->type,
                'opening_balance' => (float) $openingBalance,
                'cash_in' => (float) $cashIn,
                'cash_out' => (float) $cashOut,
                'net_cash_flow' => (float) $netCashFlow,
                'closing_balance' => (float) $closingBalance,
            ];
        }

        // Daily cash flow summary
        $dailyCashFlow = DB::table('cash_movements')
            ->whereBetween('movement_date', [$dateFrom, $dateTo])
            ->selectRaw('
                DATE(movement_date) as date,
                SUM(CASE WHEN reference_type IN ("CashIn", "Bank") THEN debit ELSE 0 END) as cash_in,
                SUM(CASE WHEN reference_type = "CashOut" THEN credit ELSE 0 END) as cash_out
            ')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($day) {
                return [
                    'date' => $day->date,
                    'date_formatted' => Carbon::parse($day->date)->format('d M Y'),
                    'cash_in' => (float) $day->cash_in,
                    'cash_out' => (float) $day->cash_out,
                    'net_flow' => (float) ($day->cash_in - $day->cash_out),
                ];
            });

        return Inertia::render('reports/cash-flow/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'summary' => [
                'total_opening_balance' => $totalOpeningBalance,
                'total_cash_in' => $totalCashIn,
                'total_cash_out' => $totalCashOut,
                'total_net_flow' => $totalCashIn - $totalCashOut,
                'total_closing_balance' => $totalClosingBalance,
            ],
            'bankCashFlow' => $cashFlowData,
            'dailyCashFlow' => $dailyCashFlow,
        ]);
    }

    /**
     * Print cash flow report as PDF
     */
    public function print(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));

            $banks = Bank::orderBy('name')->get();

            $cashFlowData = [];
            $totalOpeningBalance = 0;
            $totalCashIn = 0;
            $totalCashOut = 0;
            $totalClosingBalance = 0;

            foreach ($banks as $bank) {
                $openingBalance = $bank->initial_balance;
                $openingMovements = CashMovement::where('bank_id', $bank->id)
                    ->where('movement_date', '<', $dateFrom)
                    ->orderBy('movement_date', 'desc')
                    ->orderBy('id', 'desc')
                    ->first();

                if ($openingMovements) {
                    $openingBalance = $openingMovements->balance;
                }

                $cashIn = CashMovement::where('bank_id', $bank->id)
                    ->whereBetween('movement_date', [$dateFrom, $dateTo])
                    ->whereIn('reference_type', ['CashIn', 'Bank'])
                    ->sum('debit');

                $cashOut = CashMovement::where('bank_id', $bank->id)
                    ->whereBetween('movement_date', [$dateFrom, $dateTo])
                    ->where('reference_type', 'CashOut')
                    ->sum('credit');

                $closingMovements = CashMovement::where('bank_id', $bank->id)
                    ->where('movement_date', '<=', $dateTo)
                    ->orderBy('movement_date', 'desc')
                    ->orderBy('id', 'desc')
                    ->first();

                $closingBalance = $openingBalance;
                if ($closingMovements) {
                    $closingBalance = $closingMovements->balance;
                } else {
                    $closingBalance = $openingBalance + $cashIn - $cashOut;
                }

                $totalOpeningBalance += $openingBalance;
                $totalCashIn += $cashIn;
                $totalCashOut += $cashOut;
                $totalClosingBalance += $closingBalance;

                $cashFlowData[] = [
                    'bank_name' => $bank->name,
                    'bank_type' => $bank->type,
                    'opening_balance' => (float) $openingBalance,
                    'cash_in' => (float) $cashIn,
                    'cash_out' => (float) $cashOut,
                    'net_cash_flow' => (float) ($cashIn - $cashOut),
                    'closing_balance' => (float) $closingBalance,
                ];
            }

            $summary = [
                'total_opening_balance' => $totalOpeningBalance,
                'total_cash_in' => $totalCashIn,
                'total_cash_out' => $totalCashOut,
                'total_net_flow' => $totalCashIn - $totalCashOut,
                'total_closing_balance' => $totalClosingBalance,
            ];

            $pdf = Pdf::loadView('pdf.reports.cash-flow', [
                'title' => 'Laporan Arus Kas',
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'summary' => $summary,
                'bankCashFlow' => $cashFlowData,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-arus-kas-' . $dateFrom . '-to-' . $dateTo . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Cash Flow Report - Exception caught', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return back()->withErrors([
                'message' => 'Error generating PDF: ' . $e->getMessage(),
            ]);
        }
    }
}
