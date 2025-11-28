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

class PayableAgingController extends Controller
{
    /**
     * Display payable aging report
     */
    public function index(Request $request): Response
    {
        $asOfDate = $request->get('as_of_date', now()->format('Y-m-d'));
        $asOfDateCarbon = Carbon::parse($asOfDate);

        // Get all confirmed purchases with remaining amount
        $purchases = Purchase::with('supplier')
            ->where('status', 'confirmed')
            ->whereNotNull('due_date')
            ->get()
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($purchase) {
                return $purchase->remaining_amount > 0;
            });

        $agingData = [];
        $total0_30 = 0;
        $total31_60 = 0;
        $total61_90 = 0;
        $totalOver90 = 0;
        $grandTotal = 0;

        foreach ($purchases as $purchase) {
            $dueDate = Carbon::parse($purchase->due_date)->startOfDay();
            $asOfDateStart = $asOfDateCarbon->copy()->startOfDay();
            
            // Calculate days difference: positive if asOfDate is after dueDate (overdue)
            $daysDifference = $asOfDateStart->diffInDays($dueDate, false);
            
            // If daysDifference is negative, it means dueDate is in the future (not yet due)
            // If daysDifference is positive, it means dueDate is in the past (overdue)
            $isOverdue = $daysDifference > 0;
            $daysOverdue = $isOverdue ? $daysDifference : 0;

            $age0_30 = 0;
            $age31_60 = 0;
            $age61_90 = 0;
            $ageOver90 = 0;

            if ($isOverdue) {
                // Overdue - categorize by days overdue
                if ($daysOverdue <= 30) {
                    $age0_30 = $purchase->remaining_amount;
                } elseif ($daysOverdue > 30 && $daysOverdue <= 60) {
                    $age31_60 = $purchase->remaining_amount;
                } elseif ($daysOverdue > 60 && $daysOverdue <= 90) {
                    $age61_90 = $purchase->remaining_amount;
                } else {
                    $ageOver90 = $purchase->remaining_amount;
                }
            } else {
                // Not yet due - put in 0-30 bucket
                $daysUntilDue = abs($daysDifference);
                if ($daysUntilDue <= 30) {
                    $age0_30 = $purchase->remaining_amount;
                }
            }

            $total0_30 += $age0_30;
            $total31_60 += $age31_60;
            $total61_90 += $age61_90;
            $totalOver90 += $ageOver90;
            $grandTotal += $purchase->remaining_amount;

            $agingData[] = [
                'purchase_id' => $purchase->id,
                'purchase_number' => $purchase->purchase_number,
                'purchase_date' => $purchase->purchase_date,
                'due_date' => $purchase->due_date,
                'supplier_id' => $purchase->supplier_id,
                'supplier_name' => $purchase->supplier ? $purchase->supplier->name : 'No Supplier',
                'total_amount' => (float) $purchase->total_amount,
                'total_paid' => (float) $purchase->total_paid,
                'remaining_amount' => (float) $purchase->remaining_amount,
                'days_overdue' => $daysOverdue,
                'days_until_due' => $isOverdue ? 0 : abs($daysDifference),
                'age_0_30' => $age0_30,
                'age_31_60' => $age31_60,
                'age_61_90' => $age61_90,
                'age_over_90' => $ageOver90,
            ];
        }

        // Group by supplier
        $supplierSummary = collect($agingData)->groupBy('supplier_id')->map(function ($supplierPurchases, $supplierId) {
            $firstPurchase = $supplierPurchases->first();
            return [
                'supplier_id' => $supplierId,
                'supplier_name' => $firstPurchase['supplier_name'],
                'count' => $supplierPurchases->count(),
                'total_remaining' => $supplierPurchases->sum('remaining_amount'),
                'age_0_30' => $supplierPurchases->sum('age_0_30'),
                'age_31_60' => $supplierPurchases->sum('age_31_60'),
                'age_61_90' => $supplierPurchases->sum('age_61_90'),
                'age_over_90' => $supplierPurchases->sum('age_over_90'),
            ];
        })->sortByDesc('total_remaining')->values();

        return Inertia::render('reports/payable-aging/index', [
            'asOfDate' => $asOfDate,
            'summary' => [
                'total_0_30' => $total0_30,
                'total_31_60' => $total31_60,
                'total_61_90' => $total61_90,
                'total_over_90' => $totalOver90,
                'grand_total' => $grandTotal,
            ],
            'supplierSummary' => $supplierSummary,
            'agingData' => $agingData,
        ]);
    }

    /**
     * Print payable aging report as PDF
     */
    public function print(Request $request)
    {
        try {
            $asOfDate = $request->get('as_of_date', now()->format('Y-m-d'));
            $asOfDateCarbon = Carbon::parse($asOfDate);

            $purchases = Purchase::with('supplier')
                ->where('status', 'confirmed')
                ->whereNotNull('due_date')
                ->get()
                ->append(['total_paid', 'remaining_amount'])
                ->filter(function ($purchase) {
                    return $purchase->remaining_amount > 0;
                });

            $agingData = [];
            $total0_30 = 0;
            $total31_60 = 0;
            $total61_90 = 0;
            $totalOver90 = 0;
            $grandTotal = 0;

            foreach ($purchases as $purchase) {
                $dueDate = Carbon::parse($purchase->due_date)->startOfDay();
                $asOfDateStart = $asOfDateCarbon->copy()->startOfDay();
                $daysDifference = $asOfDateStart->diffInDays($dueDate, false);
                $isOverdue = $daysDifference > 0;
                $daysOverdue = $isOverdue ? $daysDifference : 0;

                $age0_30 = 0;
                $age31_60 = 0;
                $age61_90 = 0;
                $ageOver90 = 0;

                if ($isOverdue) {
                    if ($daysOverdue <= 30) {
                        $age0_30 = $purchase->remaining_amount;
                    } elseif ($daysOverdue > 30 && $daysOverdue <= 60) {
                        $age31_60 = $purchase->remaining_amount;
                    } elseif ($daysOverdue > 60 && $daysOverdue <= 90) {
                        $age61_90 = $purchase->remaining_amount;
                    } else {
                        $ageOver90 = $purchase->remaining_amount;
                    }
                } else {
                    $daysUntilDue = abs($daysDifference);
                    if ($daysUntilDue <= 30) {
                        $age0_30 = $purchase->remaining_amount;
                    }
                }

                $total0_30 += $age0_30;
                $total31_60 += $age31_60;
                $total61_90 += $age61_90;
                $totalOver90 += $ageOver90;
                $grandTotal += $purchase->remaining_amount;

                $agingData[] = [
                    'purchase_number' => $purchase->purchase_number,
                    'supplier_name' => $purchase->supplier ? $purchase->supplier->name : 'No Supplier',
                    'due_date' => $purchase->due_date,
                    'remaining_amount' => (float) $purchase->remaining_amount,
                    'days_overdue' => $daysOverdue,
                    'age_0_30' => $age0_30,
                    'age_31_60' => $age31_60,
                    'age_61_90' => $age61_90,
                    'age_over_90' => $ageOver90,
                ];
            }

            $summary = [
                'total_0_30' => $total0_30,
                'total_31_60' => $total31_60,
                'total_61_90' => $total61_90,
                'total_over_90' => $totalOver90,
                'grand_total' => $grandTotal,
            ];

            $pdf = Pdf::loadView('pdf.reports.payable-aging', [
                'title' => 'Laporan Aging Hutang',
                'asOfDate' => $asOfDate,
                'summary' => $summary,
                'agingData' => $agingData,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-aging-hutang-' . $asOfDate . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Payable Aging Report - Exception caught', [
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
