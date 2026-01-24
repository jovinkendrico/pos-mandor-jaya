<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class PaymentReceiptController extends Controller
{
    /**
     * Display page for selecting invoices to print payment receipt
     */
    public function index(Request $request): Response
    {
        $query = Sale::with('customer')
            ->where('status', 'confirmed');

        // Search
        if ($request->filled('search') && trim($request->search) !== '') {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('sale_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by customer
        if ($request->filled('customer_id') && $request->customer_id !== '') {
            $query->where('customer_id', $request->customer_id);
        }

        // Date range
        if ($request->filled('date_from') && $request->date_from !== '') {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to') && $request->date_to !== '') {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        // Get all sales first (before filtering by payment status)
        $allSales = $query->orderBy('sale_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        // Get all payment totals in one query for better performance
        $saleIds = $allSales->pluck('id')->toArray();
        $paymentTotals = [];
        if (!empty($saleIds)) {
            $paymentTotals = DB::table('sale_payment_items')
                ->join('sale_payments', 'sale_payment_items.sale_payment_id', '=', 'sale_payments.id')
                ->whereIn('sale_payment_items.sale_id', $saleIds)
                ->where('sale_payments.status', 'confirmed')
                ->select('sale_payment_items.sale_id', DB::raw('SUM(sale_payment_items.amount) as total_paid'))
                ->groupBy('sale_payment_items.sale_id')
                ->pluck('total_paid', 'sale_id')
                ->toArray();
        }

        // Map sales and filter only unpaid/partially paid
        $sales = $allSales->map(function ($sale) use ($paymentTotals) {
            $totalPaid = (float) ($paymentTotals[$sale->id] ?? 0);
            $remainingAmount = max(0, $sale->total_amount - $totalPaid);

            // Only include if there's remaining amount
            if ($remainingAmount <= 0) {
                return null;
            }

            $isOverdue = $sale->due_date && $sale->due_date < now()->toDateString();

            return [
                'id' => $sale->id,
                'sale_number' => $sale->sale_number,
                'sale_date' => $sale->sale_date ? $sale->sale_date->format('Y-m-d') : now()->format('Y-m-d'),
                'due_date' => $sale->due_date ? $sale->due_date->format('Y-m-d') : null,
                'customer_id' => $sale->customer_id,
                'customer_name' => $sale->customer ? $sale->customer->name : 'No Customer',
                'customer_address' => $sale->customer ? $sale->customer->address : null,
                'total_amount' => (float) $sale->total_amount,
                'total_paid' => $totalPaid,
                'remaining_amount' => $remainingAmount,
                'is_overdue' => $isOverdue,
                'days_overdue' => $isOverdue && $sale->due_date
                    ? now()->diffInDays($sale->due_date)
                    : 0,
            ];
        })->filter(function ($sale) use ($request) {
            if (!$sale) {
                return false;
            }
            // Apply overdue filter after calculating remaining amount
            if ($request->has('overdue_only') && $request->boolean('overdue_only')) {
                return $sale['is_overdue'] === true;
            }
            return true;
        })->values();

        // Get all customers for filter
        $customers = Customer::orderBy('name')->get(['id', 'name']);

        return Inertia::render('payment-receipt/index', [
            'sales' => $sales,
            'customers' => $customers,
            'filters' => [
                'search' => $request->get('search', ''),
                'customer_id' => $request->get('customer_id', ''),
                'date_from' => $request->get('date_from', ''),
                'date_to' => $request->get('date_to', ''),
                'overdue_only' => $request->get('overdue_only', false),
            ],
        ]);
    }

    /**
     * Print payment receipt for selected invoices
     */
    public function print(Request $request)
    {
        try {
            $saleIds = $request->input('sale_ids', []);

            if (empty($saleIds)) {
                return back()->withErrors(['message' => 'Pilih minimal satu faktur untuk dicetak.']);
            }

            // Get sales with customer and payment info
            $sales = Sale::with('customer')
                ->whereIn('id', $saleIds)
                ->where('status', 'confirmed')
                ->orderBy('sale_date', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            if ($sales->isEmpty()) {
                return back()->withErrors(['message' => 'Faktur tidak ditemukan.']);
            }

            // Group by customer
            $groupedByCustomer = $sales->groupBy('customer_id');

            // Get all payment totals for selected sales at once
            $paymentTotals = DB::table('sale_payment_items')
                ->join('sale_payments', 'sale_payment_items.sale_payment_id', '=', 'sale_payments.id')
                ->whereIn('sale_payment_items.sale_id', $saleIds)
                ->where('sale_payments.status', 'confirmed')
                ->select('sale_payment_items.sale_id', DB::raw('SUM(sale_payment_items.amount) as total_paid'))
                ->groupBy('sale_payment_items.sale_id')
                ->pluck('total_paid', 'sale_id')
                ->toArray();

            $receipts = [];
            foreach ($groupedByCustomer as $customerId => $customerSales) {
                $customer = $customerSales->first()->customer;
                $invoiceData = [];

                $totalAmount = 0;
                $totalPaid = 0;
                $totalRemaining = 0;

                foreach ($customerSales as $sale) {
                    $totalPaidForSale = (float) ($paymentTotals[$sale->id] ?? 0);
                    $remainingAmount = max(0, $sale->total_amount - $totalPaidForSale);

                    $invoiceData[] = [
                        'sale_number' => $sale->sale_number,
                        'sale_date' => $sale->sale_date ? $sale->sale_date->format('d/m/Y') : '-',
                        'due_date' => $sale->due_date ? $sale->due_date->format('d/m/Y') : '-',
                        'total_amount' => (float) $sale->total_amount,
                        'total_paid' => (float) $totalPaidForSale,
                        'remaining_amount' => (float) $remainingAmount,
                        'is_overdue' => $sale->due_date && $sale->due_date < now()->toDateString(),
                    ];

                    $totalAmount += $sale->total_amount;
                    $totalPaid += $totalPaidForSale;
                    $totalRemaining += $remainingAmount;
                }

                $receipts[] = [
                    'customer' => [
                        'id' => $customer ? $customer->id : null,
                        'name' => $customer ? $customer->name : 'No Customer',
                        'address' => $customer ? $customer->address : null,
                        'phone_number' => $customer ? $customer->phone_number : null,
                    ],
                    'invoices' => $invoiceData,
                    'summary' => [
                        'total_invoices' => count($invoiceData),
                        'total_amount' => $totalAmount,
                        'total_paid' => $totalPaid,
                        'total_remaining' => $totalRemaining,
                    ],
                ];
            }

            // Generate PDF
            $pdf = Pdf::loadView('pdf.payment-receipt', [
                'title' => 'Tanda Terima Faktur',
                'receipts' => $receipts,
                'print_date' => now()->format('d F Y'),
            ])->setPaper('a4', 'portrait');

            $filename = 'tanda-terima-faktur-' . now()->format('YmdHis') . '.pdf';
            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('PDF Print Payment Receipt - Exception caught', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return back()->withErrors([
                'message' => 'Error generating PDF: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Print payment receipt in dot matrix format
     */
    public function printDotMatrix(Request $request)
    {
        try {
            $saleIds = $request->input('sale_ids', []);

            if (empty($saleIds)) {
                return back()->withErrors(['message' => 'Pilih minimal satu faktur untuk dicetak.']);
            }

            // Get sales with customer and payment info
            $sales = Sale::with('customer')
                ->whereIn('id', $saleIds)
                ->where('status', 'confirmed')
                ->orderBy('sale_date', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            if ($sales->isEmpty()) {
                return back()->withErrors(['message' => 'Faktur tidak ditemukan.']);
            }

            // Group by customer
            $groupedByCustomer = $sales->groupBy('customer_id');

            // Get all payment totals for selected sales at once
            $paymentTotals = DB::table('sale_payment_items')
                ->join('sale_payments', 'sale_payment_items.sale_payment_id', '=', 'sale_payments.id')
                ->whereIn('sale_payment_items.sale_id', $saleIds)
                ->where('sale_payments.status', 'confirmed')
                ->select('sale_payment_items.sale_id', DB::raw('SUM(sale_payment_items.amount) as total_paid'))
                ->groupBy('sale_payment_items.sale_id')
                ->pluck('total_paid', 'sale_id')
                ->toArray();

            $receipts = [];
            foreach ($groupedByCustomer as $customerId => $customerSales) {
                $customer = $customerSales->first()->customer;
                $invoiceData = [];

                $totalAmount = 0;
                $totalPaid = 0;
                $totalRemaining = 0;

                foreach ($customerSales as $sale) {
                    $totalPaidForSale = (float) ($paymentTotals[$sale->id] ?? 0);
                    $remainingAmount = max(0, $sale->total_amount - $totalPaidForSale);

                    $invoiceData[] = [
                        'sale_number' => $sale->sale_number,
                        'sale_date' => $sale->sale_date ? $sale->sale_date->format('d/m/Y') : '-',
                        'due_date' => $sale->due_date ? $sale->due_date->format('d/m/Y') : '-',
                        'total_amount' => (float) $sale->total_amount,
                        'total_paid' => (float) $totalPaidForSale,
                        'remaining_amount' => (float) $remainingAmount,
                        'is_overdue' => $sale->due_date && $sale->due_date < now()->toDateString(),
                    ];

                    $totalAmount += $sale->total_amount;
                    $totalPaid += $totalPaidForSale;
                    $totalRemaining += $remainingAmount;
                }

                $receipts[] = [
                    'customer' => [
                        'id' => $customer ? $customer->id : null,
                        'name' => $customer ? $customer->name : 'No Customer',
                        'address' => $customer ? $customer->address : null,
                        'phone_number' => $customer ? $customer->phone_number : null,
                    ],
                    'invoices' => $invoiceData,
                    'summary' => [
                        'total_invoices' => count($invoiceData),
                        'total_amount' => $totalAmount,
                        'total_paid' => $totalPaid,
                        'total_remaining' => $totalRemaining,
                    ],
                ];
            }

            // Generate PDF with dot matrix template
            $pdf = Pdf::loadView('pdf.payment-receipt-dotmatrix', [
                'title' => 'Tanda Terima Faktur',
                'receipts' => $receipts,
                'print_date' => now()->format('d F Y'),
            ])->setPaper('a4', 'portrait');

            $filename = 'tanda-terima-faktur-' . now()->format('YmdHis') . '.pdf';
            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('PDF Print Payment Receipt Dot Matrix - Exception caught', [
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
