<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleRequest;
use App\Models\Sale;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OpenSaleController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Store a newly created sale via Open API.
     */
    public function store(StoreSaleRequest $request): JsonResponse
    {
        try {
            $sale = DB::transaction(function () use ($request) {
                // Calculate totals dari semua items
                $subtotal             = 0;
                $totalDiscount1Amount = 0;
                $totalDiscount2Amount = 0;
                $totalPphAmount       = 0;
                $totalBiayaPksAmount  = 0;
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
                    $itemNetto            = $afterDiscount1 - $itemDiscount2Amount;

                    // PPh & Biaya PKS
                    $pphPercent = $detail['pph_percent'] ?? 0;
                    $pphAmount  = ($itemNetto * $pphPercent) / 100;
                    $biayaPksPerQty = $detail['biaya_pks_per_qty'] ?? 0;
                    $biayaPksAmount = $detail['quantity'] * $biayaPksPerQty;

                    $itemSubtotal = $itemNetto - $pphAmount - $biayaPksAmount;

                    $subtotal             += $amount;
                    $totalDiscount1Amount += $itemDiscount1Amount;
                    $totalDiscount2Amount += $itemDiscount2Amount;
                    $totalPphAmount       += $pphAmount;
                    $totalBiayaPksAmount  += $biayaPksAmount;

                    $detailsData[] = [
                        'item_id'           => $detail['item_id'],
                        'item_uom_id'       => $detail['item_uom_id'],
                        'quantity'          => $detail['quantity'],
                        'price'             => $detail['price'],
                        'discount1_percent' => $itemDiscount1Percent,
                        'discount1_amount'  => $itemDiscount1Amount,
                        'discount2_percent' => $itemDiscount2Percent,
                        'discount2_amount'  => $itemDiscount2Amount,
                        'pph_percent'       => $pphPercent,
                        'pph_amount'        => $pphAmount,
                        'biaya_pks_per_qty' => $biayaPksPerQty,
                        'biaya_pks_amount'  => $biayaPksAmount,
                        'subtotal'          => $itemSubtotal,
                        'cost'              => 0,
                        'profit'            => 0,
                    ];
                }

                if (empty($detailsData)) {
                    throw new \Exception('Tidak ada detail item yang diproses.');
                }

                // Header discount
                $discount1Amount  = $totalDiscount1Amount;
                $discount1Percent = $subtotal > 0 ? ($discount1Amount / $subtotal) * 100 : 0;
                $afterDiscount1   = $subtotal - $discount1Amount;
                $discount2Amount  = $totalDiscount2Amount;
                $discount2Percent = $afterDiscount1 > 0 ? ($discount2Amount / $afterDiscount1) * 100 : 0;
                $totalAfterDiscount = $afterDiscount1 - $discount2Amount;

                // PPN
                $ppnPercent = $request->ppn_percent ?? 0;
                $ppnAmount  = ($totalAfterDiscount * $ppnPercent) / 100;
                $totalAmount = $totalAfterDiscount + $ppnAmount;

                // Create Sale with retry logic for sale number
                $maxRetries = 5;
                $sale = null;

                for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
                    try {
                        $saleNumber = Sale::generateSaleNumber($request->sale_date);

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
                            'pph_amount'           => $totalPphAmount,
                            'biaya_pks_amount'     => $totalBiayaPksAmount,
                            'total_amount'         => $totalAmount - $totalPphAmount - $totalBiayaPksAmount,
                            'total_cost'           => 0,
                            'total_profit'         => 0,
                            'status'               => 'pending',
                            'notes'                => $request->notes,
                            'created_by'           => auth()->id(),
                            'updated_by'           => auth()->id(),
                        ]);
                        break;
                    } catch (\Illuminate\Database\QueryException $e) {
                        if ($e->getCode() == 23000 && (str_contains($e->getMessage(), 'sale_number'))) {
                            if ($attempt === $maxRetries - 1) throw $e;
                            usleep(10000 * ($attempt + 1));
                            continue;
                        }
                        throw $e;
                    }
                }

                if (!$sale) throw new \Exception('Gagal membuat penjualan.');

                // Create details
                foreach ($detailsData as $detailData) {
                    $sale->details()->create($detailData);
                }

                if (empty($sale->notes)) {
                    $sale->update(['notes' => $sale->formatted_item_description]);
                }

                return $sale;
            });

            return response()->json([
                'success' => true,
                'message' => 'Penjualan berhasil ditambahkan.',
                'data'    => $sale->load('details.item'),
            ], 201);

        } catch (\Exception $e) {
            Log::error('Open API Sale Creation Error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan penjualan: ' . $e->getMessage(),
            ], 400);
        }
    }
}
