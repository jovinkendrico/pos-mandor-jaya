<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PurchaseBySupplierReportController extends Controller
{
    /**
     * Display purchase by supplier report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get purchases grouped by supplier
        $supplierPurchases = DB::table('purchases')
            ->leftJoin('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->where('purchases.status', 'confirmed')
            ->whereBetween('purchases.purchase_date', [$dateFrom, $dateTo])
            ->select(
                'suppliers.id as supplier_id',
                'suppliers.name as supplier_name',
                DB::raw('COUNT(purchases.id) as transaction_count'),
                DB::raw('SUM(purchases.total_amount) as total_purchases'),
                DB::raw('SUM(purchases.subtotal) as total_subtotal'),
                DB::raw('SUM(purchases.discount1_amount + purchases.discount2_amount) as total_discount'),
                DB::raw('SUM(purchases.ppn_amount) as total_ppn')
            )
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderBy('total_purchases', 'desc')
            ->get()
            ->map(function ($row) {
                return [
                    'supplier_id' => $row->supplier_id,
                    'supplier_name' => $row->supplier_name ?: 'No Supplier',
                    'transaction_count' => (int) $row->transaction_count,
                    'total_purchases' => (float) $row->total_purchases,
                    'total_subtotal' => (float) $row->total_subtotal,
                    'total_discount' => (float) $row->total_discount,
                    'total_ppn' => (float) $row->total_ppn,
                    'avg_purchase_value' => (float) ($row->transaction_count > 0 ? $row->total_purchases / $row->transaction_count : 0),
                ];
            });

        // Calculate totals
        $summary = [
            'total_suppliers' => $supplierPurchases->count(),
            'total_transactions' => $supplierPurchases->sum('transaction_count'),
            'total_purchases' => $supplierPurchases->sum('total_purchases'),
            'total_subtotal' => $supplierPurchases->sum('total_subtotal'),
            'total_discount' => $supplierPurchases->sum('total_discount'),
            'total_ppn' => $supplierPurchases->sum('total_ppn'),
        ];

        $summary['avg_purchase_value'] = $summary['total_transactions'] > 0 
            ? $summary['total_purchases'] / $summary['total_transactions'] 
            : 0;

        return Inertia::render('reports/purchase-by-supplier/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'summary' => $summary,
            'supplierPurchases' => $supplierPurchases,
        ]);
    }
}
