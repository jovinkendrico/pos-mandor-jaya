<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\UpdateSaleRequest;
use App\Models\Sale;
use App\Models\Customer;
use App\Models\Item;
use App\Services\StockService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Sale::with(['customer', 'details.item', 'details.itemUom', 'creator', 'updater']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('sale_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Date range
        if ($request->filled('date_from')) {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        // Sorting
        $sortBy    = $request->get('sort_by', 'sale_date');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = ['sale_date', 'sale_number', 'total_amount', 'status'];

        $query->orderBy(in_array($sortBy, $allowedSortFields) ? $sortBy : 'sale_date', $sortOrder)
            ->orderBy('id', 'desc');

        // Default page size 10
        $perPage = $request->get('per_page', 10);

        // Paginate at DB level
        $sales = $query->paginate($perPage)->withQueryString();

        // Append computed attributes
        $sales->getCollection()->each->append(['total_paid', 'remaining_amount']);

        // Payment status filter (applies post-append)
        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            $filtered = $sales->getCollection()->filter(function ($sale) use ($request) {
                return $request->payment_status === 'paid'
                    ? $sale->remaining_amount <= 0
                    : $sale->remaining_amount > 0;
            });

            $sales->setCollection($filtered->values());
        }

        return Inertia::render('transaction/sale/index', [
            'sales'   => $sales,
            'filters' => [
                'search'         => $request->get('search', ''),
                'status'         => $request->get('status', 'all'),
                'payment_status' => $request->get('payment_status', 'all'),
                'date_from'      => $request->get('date_from', ''),
                'date_to'        => $request->get('date_to', ''),
                'sort_by'        => $sortBy,
                'sort_order'     => $sortOrder,
                'per_page'       => $perPage,
            ],
        ]);
    }



    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $customers = Customer::orderBy('name')->limit(10)->get();
        $items     = Item::with('itemUoms.uom')->where('stock', '>', 0)->orderBy('name')->get();

        return Inertia::render('transaction/sale/create', [
            'customers' => $customers,
            'items'     => $items,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSaleRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            // Calculate totals dari semua items
            $subtotal             = 0;
            $totalDiscount1Amount = 0;
            $totalDiscount2Amount = 0;
            $detailsData          = [];

            foreach ($request->details as $detail) {
                // Calculate per item
                $amount = $detail['quantity'] * $detail['price'];

                // Discount 1 per item
                $itemDiscount1Percent = $detail['discount1_percent'] ?? 0;
                $itemDiscount1Amount  = ($amount * $itemDiscount1Percent) / 100;
                $afterDiscount1       = $amount - $itemDiscount1Amount;

                // Discount 2 per item
                $itemDiscount2Percent = $detail['discount2_percent'] ?? 0;
                $itemDiscount2Amount  = ($afterDiscount1 * $itemDiscount2Percent) / 100;
                $itemSubtotal         = $afterDiscount1 - $itemDiscount2Amount;

                $subtotal += $amount; // Sum all amounts before discount
                $totalDiscount1Amount += $itemDiscount1Amount;
                $totalDiscount2Amount += $itemDiscount2Amount;

                $detailsData[] = [
                    'item_id'           => $detail['item_id'],
                    'item_uom_id'       => $detail['item_uom_id'],
                    'quantity'          => $detail['quantity'],
                    'price'             => $detail['price'],
                    'discount1_percent' => $itemDiscount1Percent,
                    'discount1_amount'  => $itemDiscount1Amount,
                    'discount2_percent' => $itemDiscount2Percent,
                    'discount2_amount'  => $itemDiscount2Amount,
                    'subtotal'          => $itemSubtotal,
                    'cost'              => 0,
                    'profit'            => 0,
                ];
            }

            // Header discount calculated from sum of item discounts
            $discount1Amount  = $totalDiscount1Amount;
            $discount1Percent = $subtotal > 0 ? ($discount1Amount / $subtotal) * 100 : 0;

            // Calculate discount 2 (applied after discount 1)
            $afterDiscount1   = $subtotal - $discount1Amount;
            $discount2Amount  = $totalDiscount2Amount;
            $discount2Percent = $afterDiscount1 > 0 ? ($discount2Amount / $afterDiscount1) * 100 : 0;

            $totalAfterDiscount = $afterDiscount1 - $discount2Amount;

            // Calculate PPN
            $ppnPercent = $request->ppn_percent ?? 0;
            $ppnAmount  = ($totalAfterDiscount * $ppnPercent) / 100;

            $totalAmount = $totalAfterDiscount + $ppnAmount;

            // Generate sale number with retry logic to handle race conditions
            $maxRetries = 5;
            $sale       = null;

            for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
                try {
                    $saleNumber = Sale::generateSaleNumber($request->sale_date);

                    // Create sale
                    $sale = Sale::create([
                        'sale_number'          => $saleNumber,
                        'customer_id'          => $request->customer_id,
                        'sale_date'            => $request->sale_date,
                        'due_date'             => $request->due_date,
                        'subtotal'             => $subtotal,
                        'discount1_percent'    => $discount1Percent,
                        'discount1_amount'     => $discount1Amount,
                        'discount2_percent'    => $discount2Percent,
                        'discount2_amount'     => $discount2Amount,
                        'total_after_discount' => $totalAfterDiscount,
                        'ppn_percent'          => $ppnPercent,
                        'ppn_amount'           => $ppnAmount,
                        'total_amount'         => $totalAmount,
                        'total_cost'           => 0, // Will be calculated on confirm
                        'total_profit'         => 0, // Will be calculated on confirm
                        'status'               => 'pending',
                        'notes'                => $request->notes,
                        'created_by'           => auth()->id(),
                        'updated_by'           => auth()->id(),
                    ]);

                    break; // Success, exit retry loop
                } catch (\Illuminate\Database\QueryException $e) {
                    // Check if it's a unique constraint violation (SQLSTATE 23000)
                    if ($e->getCode() == 23000 && (str_contains($e->getMessage(), 'sale_number') || str_contains($e->getMessage(), 'sales_sale_number_unique'))) {
                        if ($attempt === $maxRetries - 1) {
                            throw $e; // Re-throw on last attempt
                        }
                        // Wait a tiny bit before retrying (microseconds)
                        usleep(10000 * ($attempt + 1)); // 10ms, 20ms, 30ms, etc.
                        continue;
                    }
                    throw $e; // Re-throw if it's a different error
                }
            }

            if (!$sale) {
                throw new \Exception('Failed to create sale after ' . $maxRetries . ' attempts');
            }

            // Create sale details
            foreach ($detailsData as $detailData) {
                $sale->details()->create($detailData);
            }
        });

        return redirect()->route('sales.index')
            ->with('success', 'Penjualan berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Sale $sale): Response
    {
        $sale->load(['customer', 'details.item', 'details.itemUom.uom', 'creator', 'updater']);

        return Inertia::render('transaction/sale/show', [
            'sale' => $sale,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Sale $sale): Response|RedirectResponse
    {
        // Only allow edit if status is pending
        if ($sale->status === 'confirmed') {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Penjualan yang sudah dikonfirmasi tidak dapat diedit.');
        }

        $sale->load(['details.item', 'details.itemUom']);
        $customers = Customer::orderBy('name')->limit(5)->get();
        $items     = Item::with('itemUoms.uom')->where('stock', '>', 0)->orderBy('name')->get();

        return Inertia::render('transaction/sale/edit', [
            'sale'      => $sale,
            'customers' => $customers,
            'items'     => $items,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSaleRequest $request, Sale $sale): RedirectResponse
    {
        // Only allow update if status is pending
        if ($sale->status === 'confirmed') {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Penjualan yang sudah dikonfirmasi tidak dapat diedit.');
        }

        DB::transaction(function () use ($request, $sale) {
            // Calculate totals dari semua items (same as store)
            $subtotal             = 0;
            $totalDiscount1Amount = 0;
            $totalDiscount2Amount = 0;
            $detailsData          = [];

            foreach ($request->details as $detail) {
                // Calculate per item
                $amount = $detail['quantity'] * $detail['price'];

                // Discount 1 per item
                $itemDiscount1Percent = $detail['discount1_percent'] ?? 0;
                $itemDiscount1Amount  = ($amount * $itemDiscount1Percent) / 100;
                $afterDiscount1       = $amount - $itemDiscount1Amount;

                // Discount 2 per item
                $itemDiscount2Percent = $detail['discount2_percent'] ?? 0;
                $itemDiscount2Amount  = ($afterDiscount1 * $itemDiscount2Percent) / 100;
                $itemSubtotal         = $afterDiscount1 - $itemDiscount2Amount;

                $subtotal += $amount; // Sum all amounts before discount
                $totalDiscount1Amount += $itemDiscount1Amount;
                $totalDiscount2Amount += $itemDiscount2Amount;

                $detailsData[] = [
                    'item_id'           => $detail['item_id'],
                    'item_uom_id'       => $detail['item_uom_id'],
                    'quantity'          => $detail['quantity'],
                    'price'             => $detail['price'],
                    'discount1_percent' => $itemDiscount1Percent,
                    'discount1_amount'  => $itemDiscount1Amount,
                    'discount2_percent' => $itemDiscount2Percent,
                    'discount2_amount'  => $itemDiscount2Amount,
                    'subtotal'          => $itemSubtotal,
                    'cost'              => 0,
                    'profit'            => 0,
                ];
            }

            // Header discount calculated from sum of item discounts
            $discount1Amount  = $totalDiscount1Amount;
            $discount1Percent = $subtotal > 0 ? ($discount1Amount / $subtotal) * 100 : 0;

            $afterDiscount1   = $subtotal - $discount1Amount;
            $discount2Amount  = $totalDiscount2Amount;
            $discount2Percent = $afterDiscount1 > 0 ? ($discount2Amount / $afterDiscount1) * 100 : 0;

            $totalAfterDiscount = $afterDiscount1 - $discount2Amount;

            $ppnPercent = $request->ppn_percent ?? 0;
            $ppnAmount  = ($totalAfterDiscount * $ppnPercent) / 100;

            $totalAmount = $totalAfterDiscount + $ppnAmount;

            // Update sale
            $sale->update([
                'customer_id'          => $request->customer_id,
                'sale_date'            => $request->sale_date,
                'due_date'             => $request->due_date,
                'subtotal'             => $subtotal,
                'discount1_percent'    => $discount1Percent,
                'discount1_amount'     => $discount1Amount,
                'discount2_percent'    => $discount2Percent,
                'discount2_amount'     => $discount2Amount,
                'total_after_discount' => $totalAfterDiscount,
                'ppn_percent'          => $ppnPercent,
                'ppn_amount'           => $ppnAmount,
                'total_amount'         => $totalAmount,
                'notes'                => $request->notes,
                'updated_by'           => auth()->id(),
            ]);

            // Delete old details and recreate
            $sale->details()->delete();

            // Create new details
            foreach ($detailsData as $detailData) {
                $sale->details()->create($detailData);
            }
        });

        return redirect()->route('sales.index')
            ->with('success', 'Penjualan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sale $sale): RedirectResponse
    {
        // Only allow delete if status is pending
        if ($sale->status === 'confirmed') {
            $errorMessage = "Penjualan yang sudah dikonfirmasi tidak dapat dihapus.";
            return redirect()->back()->withErrors(['msg' => $errorMessage]);
        }

        $sale->delete();

        return redirect()->route('sales.index')
            ->with('success', 'Penjualan berhasil dihapus.');
    }

    /**
     * Confirm sale - deduct stock and calculate FIFO profit
     */
    public function confirm(Sale $sale): RedirectResponse
    {
        if ($sale->status === 'confirmed') {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Penjualan sudah dikonfirmasi.');
        }

        // Check stock availability
        foreach ($sale->details as $detail) {
            $baseQty = $detail->quantity * $detail->itemUom->conversion_value;
            if ($detail->item->stock < $baseQty) {
                $errorMessage = "Stok {$detail->item->name} tidak mencukupi.";
                return redirect()->back()->withErrors(['msg' => $errorMessage]);
            }
        }

        $this->stockService->confirmSale($sale);

        return redirect()->route('sales.show', $sale)
            ->with('success', 'Penjualan berhasil dikonfirmasi. Profit sudah dihitung dengan FIFO.');
    }

    /**
     * Unconfirm sale - restore stock
     */
    public function unconfirm(Sale $sale): RedirectResponse
    {
        if ($sale->status === 'pending') {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Penjualan belum dikonfirmasi.');
        }

        $this->stockService->unconfirmSale($sale);

        return redirect()->route('sales.show', $sale)
            ->with('success', 'Konfirmasi penjualan dibatalkan. Stock dikembalikan.');
    }

    /**
     * Print sale as PDF
     */
    public function print(Sale $sale)
    {
        try {
            $sale->load(['customer', 'details.item', 'details.itemUom.uom']);

            // 9.5 x 11 inches = 241 x 279 mm = 684 x 792 points
            $pdf = Pdf::loadView('pdf.sale', [
                'title' => 'MJ - ' . $sale->sale_number,
                'sale'  => $sale,
            ])->setPaper([0, 0, 684, 792], 'portrait'); // 9.5 x 11 inches

            $filename = 'sale-' . $sale->sale_number . '.pdf';

            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Sale - Exception caught', [
                'sale_id' => $sale->id,
                'error'   => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);

            return back()->withErrors([
                'message' => 'Error generating PDF: ' . $e->getMessage(),
            ]);
        }
    }
}
