<?php

namespace App\Http\Controllers;

use App\Models\SaleReturn;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SaleReturnReportController extends Controller
{
    /**
     * Display sale return report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get confirmed sale returns
        $saleReturns = SaleReturn::with(['sale.customer', 'details.item'])
            ->where('status', 'confirmed')
            ->whereBetween('return_date', [$dateFrom, $dateTo])
            ->orderBy('return_date', 'desc')
            ->orderBy('return_number', 'desc')
            ->get();

        // Calculate summary
        $summary = [
            'total_returns' => $saleReturns->count(),
            'total_subtotal' => $saleReturns->sum('subtotal'),
            'total_discount1' => $saleReturns->sum('discount1_amount'),
            'total_discount2' => $saleReturns->sum('discount2_amount'),
            'total_after_discount' => $saleReturns->sum('total_after_discount'),
            'total_ppn' => $saleReturns->sum('ppn_amount'),
            'total_amount' => $saleReturns->sum('total_amount'),
            'total_cost' => $saleReturns->sum('total_cost'),
            'total_profit_adjustment' => $saleReturns->sum('total_profit_adjustment'),
        ];

        // Group by return type
        $byReturnType = $saleReturns->groupBy('return_type')->map(function ($returns) {
            return [
                'count' => $returns->count(),
                'total_amount' => $returns->sum('total_amount'),
            ];
        });

        // Group by customer
        $byCustomer = $saleReturns->groupBy(function ($return) {
            return $return->sale->customer_id ?? 'no-customer';
        })->map(function ($returns, $customerId) {
            $firstReturn = $returns->first();
            return [
                'customer_id' => $customerId === 'no-customer' ? null : $customerId,
                'customer_name' => $firstReturn->sale->customer->name ?? 'No Customer',
                'count' => $returns->count(),
                'total_amount' => $returns->sum('total_amount'),
            ];
        })->values()->sortByDesc('total_amount');

        return Inertia::render('reports/sale-return/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'summary' => $summary,
            'byReturnType' => $byReturnType,
            'byCustomer' => $byCustomer,
            'saleReturns' => $saleReturns->map(function ($return) {
                return [
                    'id' => $return->id,
                    'return_number' => $return->return_number,
                    'return_date' => $return->return_date->format('Y-m-d'),
                    'sale_number' => $return->sale->sale_number ?? '-',
                    'customer_name' => $return->sale->customer->name ?? 'No Customer',
                    'return_type' => $return->return_type,
                    'refund_method' => $return->refund_method,
                    'subtotal' => (float) $return->subtotal,
                    'discount1_amount' => (float) $return->discount1_amount,
                    'discount2_amount' => (float) $return->discount2_amount,
                    'total_after_discount' => (float) $return->total_after_discount,
                    'ppn_amount' => (float) $return->ppn_amount,
                    'total_amount' => (float) $return->total_amount,
                    'total_cost' => (float) $return->total_cost,
                    'total_profit_adjustment' => (float) $return->total_profit_adjustment,
                    'reason' => $return->reason,
                ];
            }),
        ]);
    }
}
