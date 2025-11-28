<?php

namespace App\Http\Controllers;

use App\Models\SalePayment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class SalePaymentReportController extends Controller
{
    /**
     * Display sale payment report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get confirmed sale payments
        $salePayments = SalePayment::with(['bank', 'items.sale.customer'])
            ->where('status', 'confirmed')
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->orderBy('payment_date', 'desc')
            ->orderBy('payment_number', 'desc')
            ->get();

        // Calculate summary
        $summary = [
            'total_payments' => $salePayments->count(),
            'total_amount' => $salePayments->sum('total_amount'),
        ];

        // Group by payment method
        $byPaymentMethod = $salePayments->groupBy('payment_method')->map(function ($payments) {
            return [
                'count' => $payments->count(),
                'total_amount' => $payments->sum('total_amount'),
            ];
        });

        // Group by bank
        $byBank = $salePayments->groupBy('bank_id')->map(function ($payments) {
            $firstPayment = $payments->first();
            return [
                'bank_id' => $firstPayment->bank_id,
                'bank_name' => $firstPayment->bank->name ?? 'No Bank',
                'count' => $payments->count(),
                'total_amount' => $payments->sum('total_amount'),
            ];
        })->values()->sortByDesc('total_amount');

        // Group by customer
        $byCustomer = [];
        foreach ($salePayments as $payment) {
            foreach ($payment->items as $item) {
                $customerId = $item->sale->customer_id ?? 'no-customer';
                $customerName = $item->sale->customer->name ?? 'No Customer';
                
                if (!isset($byCustomer[$customerId])) {
                    $byCustomer[$customerId] = [
                        'customer_id' => $customerId === 'no-customer' ? null : $customerId,
                        'customer_name' => $customerName,
                        'count' => 0,
                        'total_amount' => 0,
                    ];
                }
                $byCustomer[$customerId]['count']++;
                $byCustomer[$customerId]['total_amount'] += $item->amount;
            }
        }
        $byCustomer = collect($byCustomer)->sortByDesc('total_amount')->values();

        return Inertia::render('reports/sale-payment/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'summary' => $summary,
            'byPaymentMethod' => $byPaymentMethod,
            'byBank' => $byBank,
            'byCustomer' => $byCustomer,
            'salePayments' => $salePayments->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'payment_number' => $payment->payment_number,
                    'payment_date' => $payment->payment_date->format('Y-m-d'),
                    'bank_name' => $payment->bank->name ?? '-',
                    'payment_method' => $payment->payment_method,
                    'reference_number' => $payment->reference_number,
                    'total_amount' => (float) $payment->total_amount,
                    'notes' => $payment->notes,
                    'sales_count' => $payment->items->count(),
                ];
            }),
        ]);
    }

    /**
     * Print sale payment report as PDF
     */
    public function print(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));

            $salePayments = SalePayment::with(['bank', 'items.sale.customer'])
                ->where('status', 'confirmed')
                ->whereBetween('payment_date', [$dateFrom, $dateTo])
                ->orderBy('payment_date', 'desc')
                ->get();

            $summary = [
                'total_payments' => $salePayments->count(),
                'total_amount' => $salePayments->sum('total_amount'),
            ];

            $pdf = Pdf::loadView('pdf.reports.sale-payment', [
                'title' => 'Laporan Pembayaran Penjualan',
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'summary' => $summary,
                'salePayments' => $salePayments,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-pembayaran-penjualan-' . $dateFrom . '-to-' . $dateTo . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Sale Payment Report - Exception caught', [
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
