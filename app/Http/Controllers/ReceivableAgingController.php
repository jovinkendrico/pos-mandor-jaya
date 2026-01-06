<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class ReceivableAgingController extends Controller
{
    /**
     * Display receivable aging report
     */
    public function index(Request $request): Response
    {
        $asOfDate = $request->get('as_of_date', now()->format('Y-m-d'));
        $asOfDateCarbon = Carbon::parse($asOfDate);

        // Get all confirmed sales with remaining amount
        $query = Sale::with('customer')
            ->where('status', 'confirmed');

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        $sales = $query->get()
            ->append(['total_paid', 'remaining_amount'])
            ->filter(function ($sale) {
                return $sale->remaining_amount > 0;
            });

        $agingData = [];
        $total0_30 = 0;
        $total31_60 = 0;
        $total61_90 = 0;
        $totalOver90 = 0;
        $grandTotal = 0;

        foreach ($sales as $sale) {
            // Handle null due_date - use sale_date as fallback
            $dueDate = $sale->due_date 
                ? Carbon::parse($sale->due_date)->startOfDay()
                : Carbon::parse($sale->sale_date)->startOfDay();
            
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
                    $age0_30 = $sale->remaining_amount;
                } elseif ($daysOverdue > 30 && $daysOverdue <= 60) {
                    $age31_60 = $sale->remaining_amount;
                } elseif ($daysOverdue > 60 && $daysOverdue <= 90) {
                    $age61_90 = $sale->remaining_amount;
                } else {
                    $ageOver90 = $sale->remaining_amount;
                }
            } else {
                // Not yet due - put in 0-30 bucket
                $daysUntilDue = abs($daysDifference);
                if ($daysUntilDue <= 30) {
                    $age0_30 = $sale->remaining_amount;
                }
            }

            $total0_30 += $age0_30;
            $total31_60 += $age31_60;
            $total61_90 += $age61_90;
            $totalOver90 += $ageOver90;
            $grandTotal += $sale->remaining_amount;

            $agingData[] = [
                'sale_id' => $sale->id,
                'sale_number' => $sale->sale_number,
                'sale_date' => $sale->sale_date,
                'due_date' => $sale->due_date,
                'customer_id' => $sale->customer_id,
                'customer_name' => $sale->customer ? $sale->customer->name : 'No Customer',
                'total_amount' => (float) $sale->total_amount,
                'total_paid' => (float) $sale->total_paid,
                'remaining_amount' => (float) $sale->remaining_amount,
                'days_overdue' => $daysOverdue,
                'days_until_due' => $isOverdue ? 0 : abs($daysDifference),
                'age_0_30' => $age0_30,
                'age_31_60' => $age31_60,
                'age_61_90' => $age61_90,
                'age_over_90' => $ageOver90,
            ];
        }

        // Group by customer
        $customerSummary = collect($agingData)->groupBy('customer_id')->map(function ($customerSales, $customerId) {
            $firstSale = $customerSales->first();
            return [
                'customer_id' => $customerId,
                'customer_name' => $firstSale['customer_name'],
                'count' => $customerSales->count(),
                'total_remaining' => $customerSales->sum('remaining_amount'),
                'age_0_30' => $customerSales->sum('age_0_30'),
                'age_31_60' => $customerSales->sum('age_31_60'),
                'age_61_90' => $customerSales->sum('age_61_90'),
                'age_over_90' => $customerSales->sum('age_over_90'),
            ];
        })->sortByDesc('total_remaining')->values();

        return Inertia::render('reports/receivable-aging/index', [
            'asOfDate' => $asOfDate,
            'summary' => [
                'total_0_30' => $total0_30,
                'total_31_60' => $total31_60,
                'total_61_90' => $total61_90,
                'total_over_90' => $totalOver90,
                'grand_total' => $grandTotal,
            ],
            'customerSummary' => $customerSummary,
            'agingData' => $agingData,
        ]);
    }

    /**
     * Print receivable aging report as PDF
     */
    public function print(Request $request)
    {
        try {
            $asOfDate = $request->get('as_of_date', now()->format('Y-m-d'));
            $asOfDateCarbon = Carbon::parse($asOfDate);

            $query = Sale::with('customer')
                ->where('status', 'confirmed');

            if ($request->filled('customer_id')) {
                $query->where('customer_id', $request->input('customer_id'));
            }

            $sales = $query->get()
                ->append(['total_paid', 'remaining_amount'])
                ->filter(function ($sale) {
                    return $sale->remaining_amount > 0;
                });

            $agingData = [];
            $total0_30 = 0;
            $total31_60 = 0;
            $total61_90 = 0;
            $totalOver90 = 0;
            $grandTotal = 0;

            foreach ($sales as $sale) {
                // Handle null due_date - use sale_date as fallback
                $dueDate = $sale->due_date 
                    ? Carbon::parse($sale->due_date)->startOfDay()
                    : Carbon::parse($sale->sale_date)->startOfDay();
                
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
                        $age0_30 = $sale->remaining_amount;
                    } elseif ($daysOverdue > 30 && $daysOverdue <= 60) {
                        $age31_60 = $sale->remaining_amount;
                    } elseif ($daysOverdue > 60 && $daysOverdue <= 90) {
                        $age61_90 = $sale->remaining_amount;
                    } else {
                        $ageOver90 = $sale->remaining_amount;
                    }
                } else {
                    $daysUntilDue = abs($daysDifference);
                    if ($daysUntilDue <= 30) {
                        $age0_30 = $sale->remaining_amount;
                    }
                }

                $total0_30 += $age0_30;
                $total31_60 += $age31_60;
                $total61_90 += $age61_90;
                $totalOver90 += $ageOver90;
                $grandTotal += $sale->remaining_amount;

                $agingData[] = [
                    'sale_number' => $sale->sale_number,
                    'customer_name' => $sale->customer ? $sale->customer->name : 'No Customer',
                    'due_date' => $sale->due_date,
                    'remaining_amount' => (float) $sale->remaining_amount,
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

            $pdf = Pdf::loadView('pdf.reports.receivable-aging', [
                'title' => 'Laporan Aging Piutang',
                'asOfDate' => $asOfDate,
                'summary' => $summary,
                'agingData' => $agingData,
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-aging-piutang-' . $asOfDate . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Receivable Aging Report - Exception caught', [
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
