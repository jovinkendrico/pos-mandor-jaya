<?php

namespace App\Http\Controllers;

use App\Models\PurchasePayment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PurchasePaymentReportController extends Controller
{
    /**
     * Display purchase payment report
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Get confirmed purchase payments
        $purchasePayments = PurchasePayment::with(['bank', 'items.purchase.supplier'])
            ->where('status', 'confirmed')
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->orderBy('payment_date', 'desc')
            ->orderBy('payment_number', 'desc')
            ->get();

        // Calculate summary
        $summary = [
            'total_payments' => $purchasePayments->count(),
            'total_amount' => $purchasePayments->sum('total_amount'),
        ];

        // Group by payment method
        $byPaymentMethod = $purchasePayments->groupBy('payment_method')->map(function ($payments) {
            return [
                'count' => $payments->count(),
                'total_amount' => $payments->sum('total_amount'),
            ];
        });

        // Group by bank
        $byBank = $purchasePayments->groupBy('bank_id')->map(function ($payments) {
            $firstPayment = $payments->first();
            return [
                'bank_id' => $firstPayment->bank_id,
                'bank_name' => $firstPayment->bank->name ?? 'No Bank',
                'count' => $payments->count(),
                'total_amount' => $payments->sum('total_amount'),
            ];
        })->values()->sortByDesc('total_amount');

        // Group by supplier
        $bySupplier = [];
        foreach ($purchasePayments as $payment) {
            foreach ($payment->items as $item) {
                $supplierId = $item->purchase->supplier_id ?? 'no-supplier';
                $supplierName = $item->purchase->supplier->name ?? 'No Supplier';
                
                if (!isset($bySupplier[$supplierId])) {
                    $bySupplier[$supplierId] = [
                        'supplier_id' => $supplierId === 'no-supplier' ? null : $supplierId,
                        'supplier_name' => $supplierName,
                        'count' => 0,
                        'total_amount' => 0,
                    ];
                }
                $bySupplier[$supplierId]['count']++;
                $bySupplier[$supplierId]['total_amount'] += $item->amount;
            }
        }
        $bySupplier = collect($bySupplier)->sortByDesc('total_amount')->values();

        return Inertia::render('reports/purchase-payment/index', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'summary' => $summary,
            'byPaymentMethod' => $byPaymentMethod,
            'byBank' => $byBank,
            'bySupplier' => $bySupplier,
            'purchasePayments' => $purchasePayments->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'payment_number' => $payment->payment_number,
                    'payment_date' => $payment->payment_date->format('Y-m-d'),
                    'bank_name' => $payment->bank->name ?? '-',
                    'payment_method' => $payment->payment_method,
                    'reference_number' => $payment->reference_number,
                    'total_amount' => (float) $payment->total_amount,
                    'notes' => $payment->notes,
                    'purchases_count' => $payment->items->count(),
                ];
            }),
        ]);
    }
}
