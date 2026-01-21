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
        $this->authorize('viewAny', Sale::class);

        $query = Sale::with(['customer.city', 'details.item', 'details.itemUom', 'creator', 'updater']);

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

        // Customer filter (for history button from customer master)
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Date range
        if ($request->filled('date_from')) {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        // Payment status filter (must be BEFORE pagination)
        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            if ($request->payment_status === 'paid') {
                // Lunas: total_paid >= total_amount
                $query->whereRaw('(
                    SELECT COALESCE(SUM(spi.amount), 0)
                    FROM sale_payment_items spi
                    JOIN sale_payments sp ON sp.id = spi.sale_payment_id
                    WHERE spi.sale_id = sales.id
                    AND sp.status = "confirmed"
                    AND sp.deleted_at IS NULL
                ) >= sales.total_amount');
            } else {
                // Belum lunas: total_paid < total_amount
                $query->whereRaw('(
                    SELECT COALESCE(SUM(spi.amount), 0)
                    FROM sale_payment_items spi
                    JOIN sale_payments sp ON sp.id = spi.sale_payment_id
                    WHERE spi.sale_id = sales.id
                    AND sp.status = "confirmed"
                    AND sp.deleted_at IS NULL
                ) < sales.total_amount');
            }
        }

        // Sorting
        $sortBy    = $request->get('sort_by', 'sale_number');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = ['sale_date', 'sale_number', 'total_amount', 'status'];

        if ($sortBy === 'sale_number') {
            $query->orderByRaw('CAST(SUBSTRING(sale_number, 3) AS UNSIGNED) ' . $sortOrder);
        } else {
            $query->orderBy(in_array($sortBy, $allowedSortFields) ? $sortBy : 'sale_number', $sortOrder);
        }

        // Secondary sort always by sale number desc (latest created) to handle same-date or same-amount collisions
        $query->orderByRaw('CAST(SUBSTRING(sale_number, 3) AS UNSIGNED) DESC');

        // Default page size 10
        $perPage = $request->get('per_page', 10);

        // Paginate at DB level
        $sales = $query->paginate($perPage)->withQueryString();

        // Append computed attributes
        $sales->getCollection()->each->append(['total_paid', 'remaining_amount']);

        // Add permissions
        $sales->getCollection()->transform(function ($sale) {
            $sale->can = [
                'edit'   => auth()->user() ? auth()->user()->can('update', $sale) : false,
                'delete' => auth()->user() ? auth()->user()->can('delete', $sale) : false,
            ];

            return $sale;
        });

        // Get customers for filter
        $customers = \App\Models\Customer::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('transaction/sale/index', [
            'sales'     => $sales,
            'customers' => $customers,
            'filters' => [
                'search'         => $request->get('search', ''),
                'status'         => $request->get('status', 'all'),
                'payment_status' => $request->get('payment_status', 'all'),
                'customer_id'    => $request->get('customer_id', ''),
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
        $this->authorize('create', Sale::class);

        $customers = Customer::with('city')->orderBy('name')->limit(10)->get();
        $items     = Item::with('itemUoms.uom')->orderBy('name')->limit(20)->get();

        // Calculate pending stock for all items
        $pendingQuantities = DB::table('sale_details')
            ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
            ->join('item_uoms', 'item_uoms.id', '=', 'sale_details.item_uom_id')
            ->where('sales.status', 'pending')
            ->select('sale_details.item_id', DB::raw('SUM(sale_details.quantity * item_uoms.conversion_value) as pending_qty'))
            ->groupBy('sale_details.item_id')
            ->pluck('pending_qty', 'sale_details.item_id');

        $items->each(function ($item) use ($pendingQuantities) {
            $item->pending_stock = (float) ($pendingQuantities[$item->id] ?? 0);
            $item->available_stock = $item->stock - $item->pending_stock;
        });

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
        $this->authorize('create', Sale::class);

        // $this->validateStockAvailability($request->details);

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

                $subtotal             += $amount; // Sum all amounts before discount
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

            if (empty($detailsData)) {
                throw new \Exception('Tidak ada detail item yang diproses. Silakan input ulang barang.');
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
        $this->authorize('view', $sale);

        $sale->load(['customer.city', 'details.item', 'details.itemUom.uom', 'creator', 'updater']);

        // Append computed attributes for payment tracking
        $sale->append(['total_paid', 'remaining_amount']);

        $sale->can = [
            'edit'   => auth()->user() ? auth()->user()->can('update', $sale) : false,
            'delete' => auth()->user() ? auth()->user()->can('delete', $sale) : false,
        ];

        return Inertia::render('transaction/sale/show', [
            'sale' => $sale,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Sale $sale): Response|RedirectResponse
    {
        $this->authorize('update', $sale);

        // Only allow edit if status is pending
        if ($sale->status === 'confirmed') {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Penjualan yang sudah dikonfirmasi tidak dapat diedit.');
        }

        $sale->load(['customer.city', 'details.item.itemUoms.uom', 'details.itemUom']);
        $customers = Customer::with('city')->orderBy('name')->limit(5)->get();
        $items     = Item::with('itemUoms.uom')->orderBy('name')->get();

        // Calculate pending stock for all items
        $pendingQuantities = DB::table('sale_details')
            ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
            ->join('item_uoms', 'item_uoms.id', '=', 'sale_details.item_uom_id')
            ->where('sales.status', 'pending')
            // Exclude current sale from pending calculation if we are editing it
            ->where('sales.id', '!=', $sale->id)
            ->select('sale_details.item_id', DB::raw('SUM(sale_details.quantity * item_uoms.conversion_value) as pending_qty'))
            ->groupBy('sale_details.item_id')
            ->pluck('pending_qty', 'sale_details.item_id');

        $items->each(function ($item) use ($pendingQuantities) {
            $item->pending_stock = (float) ($pendingQuantities[$item->id] ?? 0);
            $item->available_stock = $item->stock - $item->pending_stock;
        });

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
        $this->authorize('update', $sale);

        // Only allow update if status is pending
        if ($sale->status === 'confirmed') {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Penjualan yang sudah dikonfirmasi tidak dapat diedit.');
        }

        DB::transaction(function () use ($request, $sale) {
            $sale = Sale::lockForUpdate()->find($sale->id);

            if ($sale->status === 'confirmed') {
                // If confirmed during the request race
                throw new \Exception('Penjualan status berubah menjadi confirmed saat proses.');
            }
            // $this->validateStockAvailability($request->details);

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

                $subtotal             += $amount; // Sum all amounts before discount
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

            if (empty($detailsData)) {
                throw new \Exception('Tidak ada detail item yang diproses. Silakan input ulang barang.');
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
        $this->authorize('delete', $sale);

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
        $this->authorize('update', $sale);

        try {
            return DB::transaction(function () use ($sale) {
                $sale = Sale::lockForUpdate()->find($sale->id);

                if ($sale->status === 'confirmed') {
                    return redirect()->route('sales.show', $sale)
                        ->with('error', 'Penjualan sudah dikonfirmasi.');
                }

                $this->stockService->confirmSale($sale);

                return redirect()->route('sales.show', $sale)
                    ->with('success', 'Penjualan berhasil dikonfirmasi. Profit sudah dihitung dengan FIFO.');
            });
        } catch (\Exception $e) {
            Log::error('Sale Confirmation Error', [
                'sale_id' => $sale->id, 
                'error' => $e->getMessage()
            ]);
            
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Gagal Konfirmasi: ' . $e->getMessage());
        }
    }

    /**
     * Unconfirm sale - restore stock
     */
    public function unconfirm(Sale $sale): RedirectResponse
    {
        $this->authorize('update', $sale);

        return DB::transaction(function () use ($sale) {
            $sale = Sale::lockForUpdate()->find($sale->id);

            if ($sale->status === 'pending') {
                return redirect()->route('sales.show', $sale)
                    ->with('error', 'Penjualan belum dikonfirmasi.');
            }

            $this->stockService->unconfirmSale($sale);

            return redirect()->route('sales.show', $sale)
                ->with('success', 'Konfirmasi penjualan dibatalkan. Stock dikembalikan.');
        });
    }

    /**
     * Print sale as PDF
     */
    public function print(Sale $sale)
    {
        $this->authorize('view', $sale);

        try {
            $sale->load(['customer.city', 'details.item', 'details.itemUom.uom']);

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

    /**
     * Validate stock availability for a list of details.
     * Aggregates quantities by item and compares with available stock.
     */
    private function validateStockAvailability(array $details): void
    {
        $itemsRequested = [];

        foreach ($details as $detail) {
            $itemId    = $detail['item_id'];
            $quantity  = $detail['quantity'];
            $itemUomId = $detail['item_uom_id'];

            if (!isset($itemsRequested[$itemId])) {
                $itemsRequested[$itemId] = [];
            }
            $itemsRequested[$itemId][] = [
                'quantity'    => $quantity,
                'item_uom_id' => $itemUomId,
            ];
        }

        $itemIds = array_keys($itemsRequested);
        $items   = Item::with('itemUoms.uom')->whereIn('id', $itemIds)->get()->keyBy('id');

        foreach ($itemsRequested as $itemId => $requests) {
            $item = $items[$itemId] ?? null;
            if (!$item) {
                throw ValidationException::withMessages([
                    'details' => "Item dengan ID {$itemId} tidak ditemukan.",
                ]);
            }

            $totalRequestedBaseQty = 0;

            foreach ($requests as $req) {
                // Find conversion value for the UOM
                $uom = $item->itemUoms->where('id', $req['item_uom_id'])->first();
                if (!$uom) {
                    throw ValidationException::withMessages([
                        'details' => "Satuan tidak valid untuk item {$item->name}.",
                    ]);
                }
                $totalRequestedBaseQty += $req['quantity'] * $uom->conversion_value;
            }

            if ($totalRequestedBaseQty > $item->stock) {
                // Get base unit name
                $baseUom      = $item->itemUoms->where('conversion_value', 1)->first();
                $baseUnitName = $baseUom ? $baseUom->uom->name : 'Satuan Dasar';

                // Format numbers for display
                $stockDisplay = rtrim(rtrim(number_format($item->stock, 2, ',', '.'), '0'), ',');
                $reqDisplay   = rtrim(rtrim(number_format($totalRequestedBaseQty, 2, ',', '.'), '0'), ',');

                throw ValidationException::withMessages([
                    'details' => "Stok {$item->name} tidak mencukupi untuk dijual. Stok saat ini: {$stockDisplay} {$baseUnitName}. Total permintaan: {$reqDisplay} {$baseUnitName}.",
                ]);
            }
        }
    }

    /**
     * Write off small remaining amount (< 100000) as rounding difference
     */
    public function writeOff(Sale $sale): RedirectResponse
    {
        $this->authorize('update', $sale);

        // Load remaining amount
        $sale->append(['total_paid', 'remaining_amount']);

        // Validate remaining amount
        if ($sale->remaining_amount <= 0) {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Penjualan sudah lunas.');
        }

        if ($sale->remaining_amount >= 100000) {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Write-off hanya untuk selisih kecil (< Rp 100.000). Sisa: Rp ' . number_format($sale->remaining_amount, 0, ',', '.'));
        }

        // Get write-off account (4999 - Selisih Pembulatan Penjualan)
        $writeOffAccount = \App\Models\ChartOfAccount::where('code', '4999')
            ->where('is_active', true)
            ->first();

        if (!$writeOffAccount) {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Akun Selisih Pembulatan (4999) tidak ditemukan. Silakan hubungi administrator.');
        }

        // Get Piutang Usaha account (1201)
        $piutangAccount = \App\Models\ChartOfAccount::where('code', '1201')
            ->where('is_active', true)
            ->first();

        if (!$piutangAccount) {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Akun Piutang Usaha (1103) tidak ditemukan. Silakan hubungi administrator.');
        }

        DB::transaction(function () use ($sale, $writeOffAccount, $piutangAccount) {
            // Store remaining amount before creating payment (it will become 0 after payment)
            $writeOffAmount = $sale->remaining_amount;

            // Create sale payment for remaining amount
            $payment = \App\Models\SalePayment::create([
                'payment_number' => \App\Models\SalePayment::generatePaymentNumber(),
                'payment_date' => now(),
                'total_amount' => $writeOffAmount,
                'bank_id' => null, // No bank involved in write-off
                'payment_method' => 'other',
                'reference_number' => null,
                'notes' => 'Write-off selisih pembulatan',
                'status' => 'confirmed', // Auto-confirm
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Create payment item
            $payment->items()->create([
                'sale_id' => $sale->id,
                'amount' => $writeOffAmount,
            ]);

            // Post journal entry directly (skip CashIn since no cash movement)
            $journalEntry = \App\Models\JournalEntry::create([
                'journal_number' => \App\Models\JournalEntry::generateJournalNumber(),
                'journal_date' => now(),
                'reference_type' => 'SalePayment',
                'reference_id' => $payment->id,
                'description' => "Write-off Penjualan #{$sale->sale_number}",
                'status' => 'posted',
            ]);

            // Journal entry details
            // Debit: Selisih Pembulatan (income)
            \App\Models\JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $writeOffAccount->id,
                'debit' => $writeOffAmount,
                'credit' => 0,
                'description' => 'Selisih pembulatan penjualan',
            ]);

            // Credit: Piutang Usaha (reduce asset)
            \App\Models\JournalEntryDetail::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $piutangAccount->id,
                'debit' => 0,
                'credit' => $writeOffAmount,
                'description' => "Write-off Piutang #{$sale->sale_number}",
            ]);
        });

        return redirect()->route('sales.show', $sale)
            ->with('success', 'Selisih pembulatan berhasil di-write-off. Penjualan sekarang lunas.');
    }
}
