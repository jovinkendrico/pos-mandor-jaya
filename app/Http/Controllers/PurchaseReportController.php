<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class PurchaseReportController extends Controller
{
    /**
     * Display purchase report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get purchases data
        $purchases = Purchase::with('supplier')
            ->where('status', 'confirmed')
            ->whereBetween('purchase_date', [$dateFrom, $dateTo])
            ->orderBy('purchase_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        // Calculate totals
        $totalSubtotal = $purchases->sum('subtotal'); // Total before discount
        $totalPurchases = $purchases->sum('total_after_discount');
        $totalPPN = $purchases->sum('ppn_amount');
        $totalAmount = $purchases->sum('total_amount');
        $totalDiscount = $purchases->sum('discount1_amount') + $purchases->sum('discount2_amount');
        $totalTransactions = $purchases->count();

        // Group by date for daily summary
        $dailySummary = $purchases->groupBy(function ($purchase) {
            return Carbon::parse($purchase->purchase_date)->format('Y-m-d');
        })->map(function ($dayPurchases) {
            return [
                'date' => Carbon::parse($dayPurchases->first()->purchase_date)->format('Y-m-d'),
                'date_formatted' => Carbon::parse($dayPurchases->first()->purchase_date)->format('d M Y'),
                'count' => $dayPurchases->count(),
                'total_purchases' => $dayPurchases->sum('total_after_discount'),
                'total_ppn' => $dayPurchases->sum('ppn_amount'),
                'total_amount' => $dayPurchases->sum('total_amount'),
                'total_discount' => $dayPurchases->sum('discount1_amount') + $dayPurchases->sum('discount2_amount'),
            ];
        })->values();

        // Group by supplier
        $supplierSummary = $purchases->groupBy('supplier_id')->map(function ($supplierPurchases, $supplierId) {
            $supplier = $supplierPurchases->first()->supplier;
            return [
                'supplier_id' => $supplierId,
                'supplier_name' => $supplier ? $supplier->name : 'No Supplier',
                'count' => $supplierPurchases->count(),
                'total_purchases' => $supplierPurchases->sum('total_after_discount'),
                'total_amount' => $supplierPurchases->sum('total_amount'),
            ];
        })->sortByDesc('total_purchases')->values();

        $avgPurchaseValue = $totalTransactions > 0 ? $totalPurchases / $totalTransactions : 0;

        return Inertia::render('reports/purchase-report/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'summary' => [
                'total_subtotal' => $totalSubtotal,
                'total_purchases' => $totalPurchases,
                'total_ppn' => $totalPPN,
                'total_amount' => $totalAmount,
                'total_discount' => $totalDiscount,
                'total_transactions' => $totalTransactions,
                'avg_purchase_value' => $avgPurchaseValue,
            ],
            'dailySummary' => $dailySummary,
            'supplierSummary' => $supplierSummary,
            'purchases' => $purchases->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'purchase_number' => $purchase->purchase_number,
                    'purchase_date' => $purchase->purchase_date,
                    'supplier_name' => $purchase->supplier ? $purchase->supplier->name : 'No Supplier',
                    'subtotal' => (float) $purchase->subtotal,
                    'total_after_discount' => (float) $purchase->total_after_discount,
                    'discount1_amount' => (float) $purchase->discount1_amount,
                    'discount2_amount' => (float) $purchase->discount2_amount,
                    'ppn_amount' => (float) $purchase->ppn_amount,
                    'total_amount' => (float) $purchase->total_amount,
                ];
            }),
        ]);
    }

    /**
     * Print purchase report as PDF
     */
    public function print(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));

            // Get purchases data
            $purchases = Purchase::with('supplier')
                ->where('status', 'confirmed')
                ->whereBetween('purchase_date', [$dateFrom, $dateTo])
                ->orderBy('purchase_date', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            // Calculate totals
            $totalSubtotal = $purchases->sum('subtotal'); // Total before discount
            $totalPurchases = $purchases->sum('total_after_discount');
            $totalPPN = $purchases->sum('ppn_amount');
            $totalAmount = $purchases->sum('total_amount');
            $totalDiscount = $purchases->sum('discount1_amount') + $purchases->sum('discount2_amount');
            $totalTransactions = $purchases->count();

            $summary = [
                'total_subtotal' => $totalSubtotal,
                'total_purchases' => $totalPurchases,
                'total_ppn' => $totalPPN,
                'total_amount' => $totalAmount,
                'total_discount' => $totalDiscount,
                'total_transactions' => $totalTransactions,
                'avg_purchase_value' => $totalTransactions > 0 ? $totalPurchases / $totalTransactions : 0,
            ];

            $pdf = Pdf::loadView('pdf.reports.purchase-report', [
                'title' => 'Laporan Pembelian',
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'summary' => $summary,
                'purchases' => $purchases,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-pembelian-' . $dateFrom . '-to-' . $dateTo . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Purchase Report - Exception caught', [
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
