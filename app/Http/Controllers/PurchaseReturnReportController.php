<?php

namespace App\Http\Controllers;

use App\Models\PurchaseReturn;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class PurchaseReturnReportController extends Controller
{
    /**
     * Display purchase return report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get confirmed purchase returns
        $purchaseReturns = PurchaseReturn::with(['purchase.supplier', 'details.item'])
            ->where('status', 'confirmed')
            ->whereBetween('return_date', [$dateFrom, $dateTo])
            ->orderBy('return_date', 'desc')
            ->orderBy('return_number', 'desc')
            ->get();

        // Calculate summary
        $summary = [
            'total_returns' => $purchaseReturns->count(),
            'total_subtotal' => $purchaseReturns->sum('subtotal'),
            'total_discount1' => $purchaseReturns->sum('discount1_amount'),
            'total_discount2' => $purchaseReturns->sum('discount2_amount'),
            'total_after_discount' => $purchaseReturns->sum('total_after_discount'),
            'total_ppn' => $purchaseReturns->sum('ppn_amount'),
            'total_amount' => $purchaseReturns->sum('total_amount'),
        ];

        // Group by return type
        $byReturnType = $purchaseReturns->groupBy('return_type')->map(function ($returns) {
            return [
                'count' => $returns->count(),
                'total_amount' => $returns->sum('total_amount'),
            ];
        });

        // Group by supplier
        $bySupplier = $purchaseReturns->groupBy(function ($return) {
            return $return->purchase->supplier_id ?? 'no-supplier';
        })->map(function ($returns, $supplierId) {
            $firstReturn = $returns->first();
            return [
                'supplier_id' => $supplierId === 'no-supplier' ? null : $supplierId,
                'supplier_name' => $firstReturn->purchase->supplier->name ?? 'No Supplier',
                'count' => $returns->count(),
                'total_amount' => $returns->sum('total_amount'),
            ];
        })->values()->sortByDesc('total_amount');

        return Inertia::render('reports/purchase-return/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'summary' => $summary,
            'byReturnType' => $byReturnType,
            'bySupplier' => $bySupplier,
            'purchaseReturns' => $purchaseReturns->map(function ($return) {
                return [
                    'id' => $return->id,
                    'return_number' => $return->return_number,
                    'return_date' => $return->return_date->format('Y-m-d'),
                    'purchase_number' => $return->purchase->purchase_number ?? '-',
                    'supplier_name' => $return->purchase->supplier->name ?? 'No Supplier',
                    'return_type' => $return->return_type,
                    'refund_method' => $return->refund_method,
                    'subtotal' => (float) $return->subtotal,
                    'discount1_amount' => (float) $return->discount1_amount,
                    'discount2_amount' => (float) $return->discount2_amount,
                    'total_after_discount' => (float) $return->total_after_discount,
                    'ppn_amount' => (float) $return->ppn_amount,
                    'total_amount' => (float) $return->total_amount,
                    'reason' => $return->reason,
                ];
            }),
        ]);
    }

    /**
     * Print purchase return report as PDF
     */
    public function print(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));

            $purchaseReturns = PurchaseReturn::with(['purchase.supplier', 'details.item'])
                ->where('status', 'confirmed')
                ->whereBetween('return_date', [$dateFrom, $dateTo])
                ->orderBy('return_date', 'desc')
                ->get();

            $summary = [
                'total_returns' => $purchaseReturns->count(),
                'total_amount' => $purchaseReturns->sum('total_amount'),
            ];

            $pdf = Pdf::loadView('pdf.reports.purchase-return', [
                'title' => 'Laporan Retur Pembelian',
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'summary' => $summary,
                'purchaseReturns' => $purchaseReturns,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-retur-pembelian-' . $dateFrom . '-to-' . $dateTo . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Purchase Return Report - Exception caught', [
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
