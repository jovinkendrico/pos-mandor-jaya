<?php

namespace App\Http\Controllers;

use App\Models\CashIn;
use App\Models\CashOut;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class CashInOutReportController extends Controller
{
    /**
     * Display cash in/out report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get confirmed cash in
        $cashIns = CashIn::with(['bank', 'chartOfAccount'])
            ->where('status', 'posted')
            ->whereBetween('cash_in_date', [$dateFrom, $dateTo])
            ->orderBy('cash_in_date', 'desc')
            ->orderBy('cash_in_number', 'desc')
            ->get();

        // Get confirmed cash out
        $cashOuts = CashOut::with(['bank', 'chartOfAccount'])
            ->where('status', 'posted')
            ->whereBetween('cash_out_date', [$dateFrom, $dateTo])
            ->orderBy('cash_out_date', 'desc')
            ->orderBy('cash_out_number', 'desc')
            ->get();

        // Calculate summary
        $summary = [
            'total_cash_in' => $cashIns->count(),
            'total_cash_in_amount' => $cashIns->sum('amount'),
            'total_cash_out' => $cashOuts->count(),
            'total_cash_out_amount' => $cashOuts->sum('amount'),
            'net_cash_flow' => $cashIns->sum('amount') - $cashOuts->sum('amount'),
        ];

        // Group cash in by bank
        $cashInByBank = $cashIns->groupBy('bank_id')->map(function ($ins) {
            $firstIn = $ins->first();
            return [
                'bank_id' => $firstIn->bank_id,
                'bank_name' => $firstIn->bank->name ?? 'No Bank',
                'count' => $ins->count(),
                'total_amount' => $ins->sum('amount'),
            ];
        })->values()->sortByDesc('total_amount');

        // Group cash out by bank
        $cashOutByBank = $cashOuts->groupBy('bank_id')->map(function ($outs) {
            $firstOut = $outs->first();
            return [
                'bank_id' => $firstOut->bank_id,
                'bank_name' => $firstOut->bank->name ?? 'No Bank',
                'count' => $outs->count(),
                'total_amount' => $outs->sum('amount'),
            ];
        })->values()->sortByDesc('total_amount');

        // Group cash in by account
        $cashInByAccount = $cashIns->groupBy('chart_of_account_id')->map(function ($ins) {
            $firstIn = $ins->first();
            return [
                'account_id' => $firstIn->chart_of_account_id,
                'account_code' => $firstIn->chartOfAccount->code ?? '-',
                'account_name' => $firstIn->chartOfAccount->name ?? 'No Account',
                'count' => $ins->count(),
                'total_amount' => $ins->sum('amount'),
            ];
        })->values()->sortByDesc('total_amount');

        // Group cash out by account
        $cashOutByAccount = $cashOuts->groupBy('chart_of_account_id')->map(function ($outs) {
            $firstOut = $outs->first();
            return [
                'account_id' => $firstOut->chart_of_account_id,
                'account_code' => $firstOut->chartOfAccount->code ?? '-',
                'account_name' => $firstOut->chartOfAccount->name ?? 'No Account',
                'count' => $outs->count(),
                'total_amount' => $outs->sum('amount'),
            ];
        })->values()->sortByDesc('total_amount');

        return Inertia::render('reports/cash-in-out/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'summary' => $summary,
            'cashInByBank' => $cashInByBank,
            'cashOutByBank' => $cashOutByBank,
            'cashInByAccount' => $cashInByAccount,
            'cashOutByAccount' => $cashOutByAccount,
            'cashIns' => $cashIns->map(function ($cashIn) {
                return [
                    'id' => $cashIn->id,
                    'cash_in_number' => $cashIn->cash_in_number,
                    'cash_in_date' => $cashIn->cash_in_date->format('Y-m-d'),
                    'bank_name' => $cashIn->bank->name ?? '-',
                    'account_code' => $cashIn->chartOfAccount->code ?? '-',
                    'account_name' => $cashIn->chartOfAccount->name ?? '-',
                    'amount' => (float) $cashIn->amount,
                    'description' => $cashIn->description,
                ];
            }),
            'cashOuts' => $cashOuts->map(function ($cashOut) {
                return [
                    'id' => $cashOut->id,
                    'cash_out_number' => $cashOut->cash_out_number,
                    'cash_out_date' => $cashOut->cash_out_date->format('Y-m-d'),
                    'bank_name' => $cashOut->bank->name ?? '-',
                    'account_code' => $cashOut->chartOfAccount->code ?? '-',
                    'account_name' => $cashOut->chartOfAccount->name ?? '-',
                    'amount' => (float) $cashOut->amount,
                    'description' => $cashOut->description,
                ];
            }),
        ]);
    }

    /**
     * Print cash in/out report as PDF
     */
    public function print(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));

            $cashIns = CashIn::with(['bank', 'chartOfAccount'])
                ->where('status', 'posted')
                ->whereBetween('cash_in_date', [$dateFrom, $dateTo])
                ->orderBy('cash_in_date', 'desc')
                ->get();

            $cashOuts = CashOut::with(['bank', 'chartOfAccount'])
                ->where('status', 'posted')
                ->whereBetween('cash_out_date', [$dateFrom, $dateTo])
                ->orderBy('cash_out_date', 'desc')
                ->get();

            $summary = [
                'total_cash_in_amount' => $cashIns->sum('amount'),
                'total_cash_out_amount' => $cashOuts->sum('amount'),
                'net_cash_flow' => $cashIns->sum('amount') - $cashOuts->sum('amount'),
            ];

            $pdf = Pdf::loadView('pdf.reports.cash-in-out', [
                'title' => 'Laporan Kas Masuk/Keluar',
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'summary' => $summary,
                'cashIns' => $cashIns,
                'cashOuts' => $cashOuts,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-kas-masuk-keluar-' . $dateFrom . '-to-' . $dateTo . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Cash In/Out Report - Exception caught', [
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
