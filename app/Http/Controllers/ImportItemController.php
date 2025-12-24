<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportItemRequest;
use App\Models\Item;
use App\Models\Uom;
use App\Models\ItemUom;
use App\Models\StockMovement;
use App\Services\ImportService;
use App\Services\ItemService;
use App\Services\JournalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ImportItemController extends Controller
{
    public function __construct(
        private readonly ImportService $importService,
        private readonly JournalService $journalService
    ) {}

    /**
     * Show the import form
     */
    public function create(): InertiaResponse
    {
        return Inertia::render('master/item/import');
    }

    /**
     * Download Excel template
     */
    public function downloadTemplate(): BinaryFileResponse
    {
        $headers = ['name', 'description', 'initial_stock', 'modal_price', 'uom_name', 'conversion_value', 'price', 'is_base'];
        $sampleRows = [
            ['Contoh Barang 1', 'Deskripsi barang 1', '10', '10000', 'PCS', '1', '50000', 'true'],
            ['Contoh Barang 1', '', '', '', 'BOX', '12', '600000', 'false'],
            ['Contoh Barang 1', '', '', '', 'KARTON', '144', '7200000', 'false'],
            ['Contoh Barang 2', 'Deskripsi barang 2', '5', '15000', 'PCS', '1', '75000', 'true'],
            ['Contoh Barang 2', '', '', '', 'BOX', '24', '1800000', 'false'],
        ];

        $tempFile = $this->importService->generateExcelTemplate($headers, $sampleRows);

        return response()->download($tempFile, 'item_import_template.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Handle the import
     */
    public function store(ImportItemRequest $request): RedirectResponse
    {
        try {
            $file = $request->file('file');
            $rows = $this->importService->parseExcel($file);

            $successCount = 0;
            $errorCount = 0;
            $errors = [];

            DB::beginTransaction();

            // Group rows by item name to handle multiple UOMs per item
            $itemsData = [];
            foreach ($rows as $rowIndex => $data) {
                $name = trim($data['name'] ?? '');
                
                if (empty($name)) {
                    $errors[] = "Row " . ($rowIndex + 1) . ": Name is required";
                    $errorCount++;
                    continue;
                }

                // Normalize name for grouping (case-insensitive)
                $nameKey = strtolower($name);
                
                if (!isset($itemsData[$nameKey])) {
                    // First row for this item - store item-level data
                    $itemsData[$nameKey] = [
                        'name' => $name,
                        'description' => trim($data['description'] ?? ''),
                        'initial_stock' => (float) ($data['initial_stock'] ?? $data['stock'] ?? 0),
                        'modal_price' => (float) ($data['modal_price'] ?? 0),
                        'uoms' => [],
                        'first_row_index' => $rowIndex + 1,
                    ];
                } else {
                    // Subsequent rows - update item data if provided (use first row values if empty)
                    if (!empty(trim($data['description'] ?? ''))) {
                        $itemsData[$nameKey]['description'] = trim($data['description']);
                    }
                    if (!empty($data['initial_stock'] ?? $data['stock'] ?? '')) {
                        $itemsData[$nameKey]['initial_stock'] = (float) ($data['initial_stock'] ?? $data['stock']);
                    }
                    if (!empty($data['modal_price'] ?? '')) {
                        $itemsData[$nameKey]['modal_price'] = (float) $data['modal_price'];
                    }
                }

                // Add UOM data for this row
                $uomName = trim($data['uom_name'] ?? $data['base_uom_name'] ?? '');
                if (!empty($uomName)) {
                    // Determine if this is base UOM
                    $isBase = false;
                    if (!empty($data['is_base'] ?? '')) {
                        $isBase = strtolower(trim($data['is_base'])) === 'true' || 
                                 trim($data['is_base']) === '1';
                    } else {
                        // If not specified and this is the first UOM, make it base
                        $isBase = empty($itemsData[$nameKey]['uoms']);
                    }
                    
                    $itemsData[$nameKey]['uoms'][] = [
                        'uom_name' => $uomName,
                        'conversion_value' => (int) ($data['conversion_value'] ?? 1),
                        'price' => (float) ($data['price'] ?? 0),
                        'is_base' => $isBase,
                    ];
                } else {
                    // No UOM specified in this row - might be an error
                    if (empty($itemsData[$nameKey]['uoms'])) {
                        $errors[] = "Row " . ($rowIndex + 1) . ": Item '{$name}' harus memiliki minimal 1 UOM";
                        $errorCount++;
                    }
                }
            }

            // Process each item
            foreach ($itemsData as $itemData) {
                try {
                    // Validate that item has at least one UOM
                    if (empty($itemData['uoms'])) {
                        $errors[] = "Row " . $itemData['first_row_index'] . ": Item '{$itemData['name']}' harus memiliki minimal 1 UOM";
                        $errorCount++;
                        continue;
                    }

                    // Validate that there's exactly one base UOM
                    $baseUoms = array_filter($itemData['uoms'], fn($uom) => $uom['is_base']);
                    if (count($baseUoms) !== 1) {
                        $errors[] = "Row " . $itemData['first_row_index'] . ": Item '{$itemData['name']}' harus memiliki tepat 1 base UOM";
                        $errorCount++;
                        continue;
                    }

                    // Generate code
                    $code = ItemService::generateCode();

                    // Create item
                    $item = Item::create([
                        'code' => $code,
                        'name' => $itemData['name'],
                        'stock' => $itemData['initial_stock'],
                        'initial_stock' => $itemData['initial_stock'],
                        'description' => $itemData['description'] ?: null,
                    ]);

                    // Create all UOMs for this item
                    foreach ($itemData['uoms'] as $uomData) {
                        $uom = Uom::firstOrCreate(['name' => $uomData['uom_name']]);
                        
                        $item->itemUoms()->create([
                            'uom_id' => $uom->id,
                            'conversion_value' => $uomData['conversion_value'],
                            'price' => $uomData['price'],
                            'is_base' => $uomData['is_base'],
                        ]);
                    }

                    // Create stock movement if stock > 0
                    if ($itemData['initial_stock'] > 0) {
                        StockMovement::create([
                            'item_id' => $item->id,
                            'reference_type' => 'OpeningBalance',
                            'reference_id' => $item->id,
                            'quantity' => $itemData['initial_stock'],
                            'unit_cost' => $itemData['modal_price'] > 0 ? $itemData['modal_price'] : 0,
                            'remaining_quantity' => $itemData['initial_stock'],
                            'movement_date' => now(),
                            'notes' => 'Opening balance saat import',
                        ]);

                        // Post to journal if modal price > 0
                        if ($itemData['modal_price'] > 0) {
                            $this->journalService->postItemOpeningStock($item, $itemData['initial_stock'], $itemData['modal_price']);
                        }
                    }

                    $successCount++;
                } catch (\Exception $e) {
                    $errorCount++;
                    $errors[] = "Row " . $itemData['first_row_index'] . " (Item: {$itemData['name']}): " . $e->getMessage();
                    Log::error('Import Item Error', [
                        'item' => $itemData['name'],
                        'row' => $itemData['first_row_index'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            DB::commit();

            $message = "Import berhasil: {$successCount} item berhasil diimport";
            if ($errorCount > 0) {
                $message .= ", {$errorCount} item gagal";
            }

            return redirect()->route('items.index')
                ->with('success', $message)
                ->with('import_errors', $errors);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Import Item Failed', ['error' => $e->getMessage()]);
            
            return redirect()->back()
                ->with('error', 'Import gagal: ' . $e->getMessage());
        }
    }
}
