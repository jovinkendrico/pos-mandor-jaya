<?php

namespace Database\Seeders;

use App\Models\Bank;
use App\Models\CashIn;
use App\Models\CashOut;
use App\Models\City;
use App\Models\Customer;
use App\Models\Item;
use App\Models\ItemUom;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\PurchasePayment;
use App\Models\PurchasePaymentItem;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\SalePayment;
use App\Models\SalePaymentItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\Uom;
use App\Services\StockService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LargeDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting large data seeding...');

        // Disable foreign key checks for better performance
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        try {
            // 1. Create Cities (if not exists)
            $this->command->info('Creating cities...');
            $cities = $this->createCities();

            // 2. Create UOMs (if not exists)
            $this->command->info('Creating UOMs...');
            $uoms = $this->createUoms();

            // 3. Create Banks/Cash (10)
            $this->command->info('Creating 10 banks/cash...');
            $banks = $this->createBanks();

            // 4. Create Items (5000)
            $this->command->info('Creating 5000 items...');
            $items = $this->createItems($uoms);

            // 5. Create Customers (500)
            $this->command->info('Creating 500 customers...');
            $customers = $this->createCustomers($cities);

            // 6. Create Suppliers (300)
            $this->command->info('Creating 300 suppliers...');
            $suppliers = $this->createSuppliers($cities);

            // 7. Create Purchases (30000)
            $this->command->info('Creating 30000 purchases...');
            $this->createPurchases($suppliers, $items, $uoms);

            // 8. Create Sales (30000) - with FIFO cost calculation
            $this->command->info('Creating 30000 sales with FIFO cost calculation...');
            $this->createSales($customers, $items, $uoms);

            // 9. Create Sale Payments
            $this->command->info('Creating sale payments...');
            $this->createSalePayments($banks);

            // 10. Create Purchase Payments
            $this->command->info('Creating purchase payments...');
            $this->createPurchasePayments($banks);

            // 11. Create Cash In/Out
            $this->command->info('Creating cash in/out transactions...');
            $this->createCashInOut($banks);

            $this->command->info('Large data seeding completed!');
        } finally {
            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }
    }

    private function createCities(): array
    {
        $cityNames = [
            'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang',
            'Makassar', 'Palembang', 'Depok', 'Tangerang', 'Bekasi',
            'Padang', 'Malang', 'Yogyakarta', 'Denpasar', 'Bandar Lampung',
            'Pekanbaru', 'Banjarmasin', 'Pontianak', 'Manado', 'Balikpapan'
        ];

        $cities = [];
        foreach ($cityNames as $name) {
            $city = City::firstOrCreate(['name' => $name]);
            $cities[] = $city;
        }

        return $cities;
    }

    private function createUoms(): array
    {
        $uomNames = ['Pcs', 'Box', 'Pack', 'Dus', 'Kg', 'Gram', 'Liter', 'Meter', 'Roll', 'Unit'];

        $uoms = [];
        foreach ($uomNames as $name) {
            $uom = Uom::firstOrCreate(['name' => $name]);
            $uoms[] = $uom;
        }

        return $uoms;
    }

    private function createBanks(): array
    {
        $banks = [];
        $bankNames = [
            'Kas Kecil', 'Bank BCA', 'Bank Mandiri', 'Bank BRI', 'Bank BNI',
            'Bank CIMB', 'Bank Danamon', 'Bank Permata', 'Bank OCBC', 'Bank Maybank'
        ];

        $chartOfAccountIds = DB::table('chart_of_accounts')
            ->whereIn('code', ['1101', '1103'])
            ->pluck('id')
            ->toArray();

        foreach ($bankNames as $index => $name) {
            $type = $index === 0 ? 'cash' : 'bank';
            $coaId = $chartOfAccountIds[$index % count($chartOfAccountIds)] ?? null;

            $bank = Bank::create([
                'name' => $name,
                'type' => $type,
                'chart_of_account_id' => $coaId,
                'account_number' => $type === 'bank' ? 'ACC' . str_pad($index, 8, '0', STR_PAD_LEFT) : null,
                'account_name' => $type === 'bank' ? $name : null,
                'balance' => rand(10000000, 100000000),
                'initial_balance' => rand(10000000, 100000000),
                'description' => "Bank/Cash untuk {$name}",
            ]);

            $banks[] = $bank;
        }

        return $banks;
    }

    private function createItems($uoms): array
    {
        $items = [];
        $batchSize = 500;
        $totalItems = 5000;

        for ($i = 0; $i < $totalItems; $i += $batchSize) {
            $batch = [];
            $currentBatch = min($batchSize, $totalItems - $i);

            for ($j = 0; $j < $currentBatch; $j++) {
                $itemNumber = $i + $j + 1;
                $code = 'ITM-' . str_pad($itemNumber, 8, '0', STR_PAD_LEFT);

                $stock = rand(0, 1000);
                $modalPrice = rand(10000, 500000);

                $batch[] = [
                    'code' => $code,
                    'name' => "Barang {$itemNumber}",
                    'stock' => $stock,
                    'initial_stock' => $stock,
                    'description' => "Deskripsi untuk Barang {$itemNumber}",
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Batch insert items
            DB::table('items')->insert($batch);

            // Get inserted items and create ItemUoms
            $insertedItems = Item::whereIn('code', array_column($batch, 'code'))->get();

            $itemUomsBatch = [];
            foreach ($insertedItems as $item) {
                $baseUom = $uoms[array_rand($uoms)];
                $items[] = $item;

                $modalPrice = rand(10000, 500000);

                // Create base UOM
                $itemUomsBatch[] = [
                    'item_id' => $item->id,
                    'uom_id' => $baseUom->id,
                    'conversion_value' => 1,
                    'price' => $modalPrice * 1.3, // 30% markup
                    'is_base' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                // Sometimes add additional UOMs
                if (rand(1, 3) === 1) {
                    $additionalUom = $uoms[array_rand($uoms)];
                    if ($additionalUom->id !== $baseUom->id) {
                        $itemUomsBatch[] = [
                            'item_id' => $item->id,
                            'uom_id' => $additionalUom->id,
                            'conversion_value' => rand(2, 10),
                            'price' => $modalPrice * 1.3 * rand(2, 10),
                            'is_base' => false,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }
            }

            // Batch insert ItemUoms
            if (!empty($itemUomsBatch)) {
                DB::table('item_uoms')->insert($itemUomsBatch);
            }

            $this->command->info("Created items: " . ($i + $currentBatch) . " / {$totalItems}");
        }

        return $items;
    }

    private function createCustomers($cities): array
    {
        $customers = [];
        $batchSize = 100;
        $totalCustomers = 500;

        for ($i = 0; $i < $totalCustomers; $i += $batchSize) {
            $batch = [];
            $currentBatch = min($batchSize, $totalCustomers - $i);

            for ($j = 0; $j < $currentBatch; $j++) {
                $customerNumber = $i + $j + 1;
                $city = $cities[array_rand($cities)];

                $batch[] = [
                    'name' => "Customer {$customerNumber}",
                    'address' => "Jl. Customer No. {$customerNumber}",
                    'city_id' => $city->id,
                    'phone_number' => '08' . str_pad(rand(100000000, 999999999), 9, '0', STR_PAD_LEFT),
                    'contact_person' => "CP Customer {$customerNumber}",
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            DB::table('customers')->insert($batch);
            $this->command->info("Created customers: " . ($i + $currentBatch) . " / {$totalCustomers}");
        }

        return Customer::all()->toArray();
    }

    private function createSuppliers($cities): array
    {
        $suppliers = [];
        $batchSize = 100;
        $totalSuppliers = 300;

        for ($i = 0; $i < $totalSuppliers; $i += $batchSize) {
            $batch = [];
            $currentBatch = min($batchSize, $totalSuppliers - $i);

            for ($j = 0; $j < $currentBatch; $j++) {
                $supplierNumber = $i + $j + 1;
                $city = $cities[array_rand($cities)];

                $batch[] = [
                    'name' => "Supplier {$supplierNumber}",
                    'address' => "Jl. Supplier No. {$supplierNumber}",
                    'city_id' => $city->id,
                    'phone_number' => '08' . str_pad(rand(100000000, 999999999), 9, '0', STR_PAD_LEFT),
                    'contact_person' => "CP Supplier {$supplierNumber}",
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            DB::table('suppliers')->insert($batch);
            $this->command->info("Created suppliers: " . ($i + $currentBatch) . " / {$totalSuppliers}");
        }

        return Supplier::all()->toArray();
    }

    private function createPurchases($suppliers, $items, $uoms): void
    {
        $totalPurchases = 30000;
        $batchSize = 100;
        $supplierIds = array_column($suppliers, 'id');

        // Get all items with their base UOMs (reload from DB to ensure we have all items)
        $itemsWithUoms = Item::with('itemUoms')->get()->keyBy('id');
        $itemIds = $itemsWithUoms->keys()->toArray();

        for ($i = 0; $i < $totalPurchases; $i += $batchSize) {
            $currentBatch = min($batchSize, $totalPurchases - $i);
            $purchases = [];
            $purchaseDetails = [];

            for ($j = 0; $j < $currentBatch; $j++) {
                $purchaseDate = Carbon::now()->subDays(rand(0, 365));

                // Generate purchase number manually to avoid lockForUpdate issues in batch
                $date = $purchaseDate->format('Ymd');
                $lastPurchase = DB::table('purchases')
                    ->where('purchase_number', 'like', 'PO' . $date . '%')
                    ->orderBy('purchase_number', 'desc')
                    ->value('purchase_number');
                $sequence = $lastPurchase ? (int) substr($lastPurchase, -4) + 1 : 1;
                $purchaseNumber = 'PO' . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);

                $supplierId = $supplierIds[array_rand($supplierIds)];

                // Create 1-5 items per purchase
                $numItems = rand(1, 5);
                $subtotal = 0;
                $details = [];

                for ($k = 0; $k < $numItems; $k++) {
                    $itemId = $itemIds[array_rand($itemIds)];
                    $item = $itemsWithUoms[$itemId] ?? null;

                    if (!$item || !$item->itemUoms->count()) {
                        continue;
                    }

                    $itemUom = $item->itemUoms->where('is_base', true)->first() ?? $item->itemUoms->first();
                    if (!$itemUom) {
                        continue;
                    }
                    $quantity = rand(1, 100);
                    $price = rand(10000, 500000);
                    $discount1Percent = rand(0, 10);
                    $discount1Amount = ($quantity * $price * $discount1Percent) / 100;
                    $afterDiscount1 = ($quantity * $price) - $discount1Amount;
                    $discount2Percent = rand(0, 5);
                    $discount2Amount = ($afterDiscount1 * $discount2Percent) / 100;
                    $itemSubtotal = $afterDiscount1 - $discount2Amount;

                    $subtotal += $itemSubtotal;

                    $details[] = [
                        'item_id' => $itemId,
                        'item_uom_id' => $itemUom->id,
                        'quantity' => $quantity,
                        'price' => $price,
                        'discount1_percent' => $discount1Percent,
                        'discount1_amount' => $discount1Amount,
                        'discount2_percent' => $discount2Percent,
                        'discount2_amount' => $discount2Amount,
                        'subtotal' => $itemSubtotal,
                    ];
                }

                if (empty($details)) {
                    continue;
                }

                $discount1Percent = rand(0, 5);
                $discount1Amount = ($subtotal * $discount1Percent) / 100;
                $totalAfterDiscount = $subtotal - $discount1Amount;
                $ppnPercent = 11;
                $ppnAmount = ($totalAfterDiscount * $ppnPercent) / 100;
                $totalAmount = $totalAfterDiscount + $ppnAmount;

                $purchaseId = DB::table('purchases')->insertGetId([
                    'purchase_number' => $purchaseNumber,
                    'supplier_id' => $supplierId,
                    'purchase_date' => $purchaseDate,
                    'due_date' => $purchaseDate->copy()->addDays(rand(7, 30)),
                    'subtotal' => $subtotal,
                    'discount1_percent' => $discount1Percent,
                    'discount1_amount' => $discount1Amount,
                    'discount2_percent' => 0,
                    'discount2_amount' => 0,
                    'total_after_discount' => $totalAfterDiscount,
                    'ppn_percent' => $ppnPercent,
                    'ppn_amount' => $ppnAmount,
                    'total_amount' => $totalAmount,
                    'status' => 'confirmed',
                    'notes' => "Purchase note {$purchaseNumber}",
                    'created_at' => $purchaseDate,
                    'updated_at' => $purchaseDate,
                ]);

                $stockMovements = [];

                foreach ($details as $detail) {
                    $purchaseDetails[] = array_merge($detail, [
                        'purchase_id' => $purchaseId,
                        'created_at' => $purchaseDate,
                        'updated_at' => $purchaseDate,
                    ]);

                    // Create stock movement for purchase
                    $unitCost = $detail['subtotal'] / $detail['quantity'];
                    $stockMovements[] = [
                        'item_id' => $detail['item_id'],
                        'reference_type' => 'Purchase',
                        'reference_id' => $purchaseId,
                        'quantity' => $detail['quantity'],
                        'unit_cost' => $unitCost,
                        'remaining_quantity' => $detail['quantity'],
                        'movement_date' => $purchaseDate,
                        'notes' => "Purchase #{$purchaseNumber}",
                        'created_at' => $purchaseDate,
                        'updated_at' => $purchaseDate,
                    ];

                    // Update item stock
                    DB::table('items')->where('id', $detail['item_id'])->increment('stock', $detail['quantity']);
                }

                // Batch insert stock movements
                if (!empty($stockMovements)) {
                    DB::table('stock_movements')->insert($stockMovements);
                }
            }

            // Batch insert purchase details
            if (!empty($purchaseDetails)) {
                DB::table('purchase_details')->insert($purchaseDetails);
            }

            $this->command->info("Created purchases: " . ($i + $currentBatch) . " / {$totalPurchases}");
        }
    }

    private function createSales($customers, $items, $uoms): void
    {
        $totalSales = 30000;
        $batchSize = 100;
        $customerIds = array_column($customers, 'id');

        // Get all items with their base UOMs (reload from DB to ensure we have all items)
        $itemsWithUoms = Item::with('itemUoms')->get()->keyBy('id');
        $itemIds = $itemsWithUoms->keys()->toArray();

        for ($i = 0; $i < $totalSales; $i += $batchSize) {
            $currentBatch = min($batchSize, $totalSales - $i);
            $sales = [];
            $saleDetails = [];

            for ($j = 0; $j < $currentBatch; $j++) {
                $saleDate = Carbon::now()->subDays(rand(0, 365));

                // Generate sale number manually to avoid lockForUpdate issues in batch
                $date = $saleDate->format('Ymd');
                $lastSale = DB::table('sales')
                    ->where('sale_number', 'like', 'SO' . $date . '%')
                    ->orderBy('sale_number', 'desc')
                    ->value('sale_number');
                $sequence = $lastSale ? (int) substr($lastSale, -4) + 1 : 1;
                $saleNumber = 'SO' . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);

                $customerId = $customerIds[array_rand($customerIds)];

                // Create 1-5 items per sale
                $numItems = rand(1, 5);
                $subtotal = 0;
                $details = [];

                for ($k = 0; $k < $numItems; $k++) {
                    $itemId = $itemIds[array_rand($itemIds)];
                    $item = $itemsWithUoms[$itemId] ?? null;

                    if (!$item || !$item->itemUoms->count()) {
                        continue;
                    }

                    $itemUom = $item->itemUoms->where('is_base', true)->first() ?? $item->itemUoms->first();
                    if (!$itemUom) {
                        continue;
                    }
                    $quantity = rand(1, 50);
                    $price = rand(15000, 600000);
                    $discount1Percent = rand(0, 15);
                    $discount1Amount = ($quantity * $price * $discount1Percent) / 100;
                    $afterDiscount1 = ($quantity * $price) - $discount1Amount;
                    $discount2Percent = rand(0, 5);
                    $discount2Amount = ($afterDiscount1 * $discount2Percent) / 100;
                    $itemSubtotal = $afterDiscount1 - $discount2Amount;

                    $subtotal += $itemSubtotal;

                    $details[] = [
                        'item_id' => $itemId,
                        'item_uom_id' => $itemUom->id,
                        'quantity' => $quantity,
                        'price' => $price,
                        'discount1_percent' => $discount1Percent,
                        'discount1_amount' => $discount1Amount,
                        'discount2_percent' => $discount2Percent,
                        'discount2_amount' => $discount2Amount,
                        'subtotal' => $itemSubtotal,
                        'cost' => 0, // Will be calculated when confirmed
                        'profit' => 0, // Will be calculated when confirmed
                    ];
                }

                if (empty($details)) {
                    continue;
                }

                $discount1Percent = rand(0, 5);
                $discount1Amount = ($subtotal * $discount1Percent) / 100;
                $totalAfterDiscount = $subtotal - $discount1Amount;
                $ppnPercent = 11;
                $ppnAmount = ($totalAfterDiscount * $ppnPercent) / 100;
                $totalAmount = $totalAfterDiscount + $ppnAmount;

                $saleId = DB::table('sales')->insertGetId([
                    'sale_number' => $saleNumber,
                    'customer_id' => $customerId,
                    'sale_date' => $saleDate,
                    'due_date' => $saleDate->copy()->addDays(rand(7, 30)),
                    'subtotal' => $subtotal,
                    'discount1_percent' => $discount1Percent,
                    'discount1_amount' => $discount1Amount,
                    'discount2_percent' => 0,
                    'discount2_amount' => 0,
                    'total_after_discount' => $totalAfterDiscount,
                    'ppn_percent' => $ppnPercent,
                    'ppn_amount' => $ppnAmount,
                    'total_amount' => $totalAmount,
                    'total_cost' => 0,
                    'total_profit' => 0,
                    'status' => 'pending', // Create as pending first, will be confirmed later with FIFO calculation
                    'notes' => "Sale note {$saleNumber}",
                    'created_at' => $saleDate,
                    'updated_at' => $saleDate,
                ]);

                foreach ($details as $detail) {
                    // Get item and UOM to check stock in base UOM
                    $item = $itemsWithUoms[$detail['item_id']] ?? null;
                    if (!$item) {
                        continue;
                    }

                    $itemUom = $item->itemUoms->where('id', $detail['item_uom_id'])->first();
                    if (!$itemUom) {
                        continue;
                    }

                    // Convert to base UOM
                    $conversion = (int) ($itemUom->conversion_value ?? 1);
                    if ($conversion < 1) {
                        $conversion = 1;
                    }
                    $baseQuantity = $detail['quantity'] * $conversion;

                    // Check if item has enough stock in base UOM
                    $itemStock = (float) $item->stock;
                    if ($itemStock < $baseQuantity) {
                        // Skip this detail if not enough stock
                        continue;
                    }

                    $saleDetails[] = array_merge($detail, [
                        'sale_id' => $saleId,
                        'created_at' => $saleDate,
                        'updated_at' => $saleDate,
                    ]);
                }

                // Update sale totals if we have details
                if (empty($saleDetails)) {
                    // Delete sale if no valid details
                    DB::table('sales')->where('id', $saleId)->delete();
                    continue;
                }
            }

            // Batch insert sale details
            if (!empty($saleDetails)) {
                DB::table('sale_details')->insert($saleDetails);
            }

            $this->command->info("Created sales (pending): " . ($i + $currentBatch) . " / {$totalSales}");
        }

        // Now confirm all sales using StockService to calculate FIFO cost and profit
        $this->command->info('Confirming sales and calculating FIFO cost/profit...');
        $this->confirmSales();
    }

    private function confirmSales(): void
    {
        $stockService = app(StockService::class);
        $batchSize = 20; // Smaller batch size to reduce memory and avoid race conditions
        $totalSales = Sale::where('status', 'pending')->count();
        $processed = 0;
        $failed = 0;

        Sale::where('status', 'pending')
            ->select('id', 'sale_number', 'sale_date', 'customer_id', 'total_amount', 'total_after_discount')
            ->orderBy('id', 'asc')
            ->chunk($batchSize, function ($sales) use ($stockService, &$processed, &$failed, $totalSales) {
                foreach ($sales as $sale) {
                    try {
                        // Reload sale with relationships
                        $sale->load(['details.item', 'details.itemUom']);

                        // Check if all items have enough stock
                        $hasEnoughStock = true;
                        foreach ($sale->details as $detail) {
                            if (!$detail->item || !$detail->itemUom) {
                                $hasEnoughStock = false;
                                break;
                            }

                            $conversion = (int) ($detail->itemUom->conversion_value ?? 1);
                            if ($conversion < 1) {
                                $conversion = 1;
                            }
                            $baseQuantity = (float) $detail->quantity * $conversion;

                            // Reload item to get fresh stock
                            $item = $detail->item->fresh(['itemUoms']);
                            if ($item->stock < $baseQuantity) {
                                $hasEnoughStock = false;
                                break;
                            }
                        }

                        if ($hasEnoughStock && $sale->details->count() > 0) {
                            $stockService->confirmSale($sale);
                            $processed++;
                        } else {
                            // Delete sale if not enough stock or no details
                            $sale->delete();
                            $failed++;
                        }

                        // Free memory
                        unset($sale);
                    } catch (\Exception $e) {
                        // Skip sale if error occurs
                        try {
                            $sale->delete();
                        } catch (\Exception $deleteException) {
                            // Ignore delete errors
                        }
                        $failed++;
                    }
                }

                // Free memory and force garbage collection
                unset($sales);
                if (function_exists('gc_collect_cycles')) {
                    gc_collect_cycles();
                }

                if ($processed % 500 === 0 || $processed + $failed >= $totalSales) {
                    $this->command->info("Confirmed sales: {$processed} / {$totalSales} (Failed: {$failed})");
                }
            });

        $this->command->info("Sales confirmation completed: {$processed} confirmed, {$failed} failed");
    }

    private function convertToBaseUom(float $quantity, $itemUom): float
    {
        if (!$itemUom) {
            return $quantity;
        }

        $conversion = (int) ($itemUom->conversion_value ?? 1);
        if ($conversion < 1) {
            $conversion = 1;
        }

        return $quantity * $conversion;
    }

    private function createSalePayments($banks): void
    {
        $bankIds = array_column($banks, 'id');
        $paymentMethods = ['cash', 'transfer', 'giro', 'cek', 'other'];
        $chunkSize = 50; // Process in smaller chunks
        $totalPayments = 10000; // Max 10000 payments
        $processed = 0;

        // Get receivable account for CashIn
        $receivableAccount = DB::table('chart_of_accounts')
            ->where('code', '1201')
            ->where('is_active', true)
            ->first();

        if (!$receivableAccount) {
            $this->command->warn('Receivable account (1201) not found. Skipping sale payments.');
            return;
        }

        // Use chunking to avoid memory issues
        Sale::where('status', 'confirmed')
            ->where('total_amount', '>', 0)
            ->select('id', 'sale_number', 'sale_date', 'total_amount', 'customer_id')
            ->chunk($chunkSize, function ($sales) use ($bankIds, $paymentMethods, $receivableAccount, &$processed, $totalPayments) {
                foreach ($sales as $sale) {
                    if ($processed >= $totalPayments) {
                        return false; // Stop chunking
                    }

                    try {
                        DB::beginTransaction();

                        $paymentDate = $sale->sale_date->copy()->addDays(rand(0, 30));
                        $date = $paymentDate->format('Ymd');

                        // Generate payment number
                        $lastPayment = DB::table('sale_payments')
                            ->where('payment_number', 'like', 'SP' . $date . '%')
                            ->orderBy('payment_number', 'desc')
                            ->value('payment_number');
                        $sequence = $lastPayment ? (int) substr($lastPayment, -4) + 1 : 1;
                        $paymentNumber = 'SP' . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);

                        $bankId = $bankIds[array_rand($bankIds)];
                        $paymentMethod = $paymentMethods[array_rand($paymentMethods)];
                        $totalAmount = (float) $sale->total_amount;

                        // Pay partial or full amount
                        $paymentAmount = rand(1, 10) <= 7 ? $totalAmount : ($totalAmount * rand(50, 99) / 100);

                        // Create payment as pending first
                        $payment = SalePayment::create([
                            'payment_number' => $paymentNumber,
                            'payment_date' => $paymentDate,
                            'total_amount' => $paymentAmount,
                            'bank_id' => $bankId,
                            'payment_method' => $paymentMethod,
                            'reference_number' => 'REF' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT),
                            'notes' => "Pembayaran untuk {$sale->sale_number}",
                            'status' => 'pending',
                        ]);

                        // Create payment item
                        SalePaymentItem::create([
                            'sale_payment_id' => $payment->id,
                            'sale_id' => $sale->id,
                            'amount' => $paymentAmount,
                        ]);

                        // Confirm payment using service logic (this will create CashIn and update bank balance)
                        $this->confirmSalePayment($payment);

                        $processed++;

                        DB::commit();

                        // Free memory
                        unset($payment, $sale);

                        if ($processed % 500 === 0) {
                            $this->command->info("Created sale payments: {$processed} / {$totalPayments}");
                            // Force garbage collection
                            if (function_exists('gc_collect_cycles')) {
                                gc_collect_cycles();
                            }
                        }
                    } catch (\Exception $e) {
                        DB::rollBack();
                        $this->command->warn("Failed to create sale payment for sale {$sale->id}: " . $e->getMessage());
                    }
                }

                return true; // Continue chunking
            });

        $this->command->info("Created sale payments: {$processed}");
    }

    private function createPurchasePayments($banks): void
    {
        $bankIds = array_column($banks, 'id');
        $paymentMethods = ['cash', 'transfer', 'giro', 'cek', 'other'];
        $chunkSize = 50; // Process in smaller chunks
        $totalPayments = 10000; // Max 10000 payments
        $processed = 0;

        // Get payable account for CashOut
        $payableAccount = DB::table('chart_of_accounts')
            ->where('code', '2101')
            ->where('is_active', true)
            ->first();

        if (!$payableAccount) {
            $this->command->warn('Payable account (2101) not found. Skipping purchase payments.');
            return;
        }

        // Use chunking to avoid memory issues
        Purchase::where('status', 'confirmed')
            ->where('total_amount', '>', 0)
            ->select('id', 'purchase_number', 'purchase_date', 'total_amount', 'supplier_id')
            ->chunk($chunkSize, function ($purchases) use ($bankIds, $paymentMethods, $payableAccount, &$processed, $totalPayments) {
                foreach ($purchases as $purchase) {
                    if ($processed >= $totalPayments) {
                        return false; // Stop chunking
                    }

                    try {
                        DB::beginTransaction();

                        $paymentDate = $purchase->purchase_date->copy()->addDays(rand(0, 30));
                        $date = $paymentDate->format('Ymd');

                        // Generate payment number
                        $lastPayment = DB::table('purchase_payments')
                            ->where('payment_number', 'like', 'PP' . $date . '%')
                            ->orderBy('payment_number', 'desc')
                            ->value('payment_number');
                        $sequence = $lastPayment ? (int) substr($lastPayment, -4) + 1 : 1;
                        $paymentNumber = 'PP' . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);

                        $bankId = $bankIds[array_rand($bankIds)];
                        $paymentMethod = $paymentMethods[array_rand($paymentMethods)];
                        $totalAmount = (float) $purchase->total_amount;

                        // Pay partial or full amount
                        $paymentAmount = rand(1, 10) <= 7 ? $totalAmount : ($totalAmount * rand(50, 99) / 100);

                        // Create payment as pending first
                        $payment = PurchasePayment::create([
                            'payment_number' => $paymentNumber,
                            'payment_date' => $paymentDate,
                            'total_amount' => $paymentAmount,
                            'bank_id' => $bankId,
                            'payment_method' => $paymentMethod,
                            'reference_number' => 'REF' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT),
                            'notes' => "Pembayaran untuk {$purchase->purchase_number}",
                            'status' => 'pending',
                        ]);

                        // Create payment item
                        PurchasePaymentItem::create([
                            'purchase_payment_id' => $payment->id,
                            'purchase_id' => $purchase->id,
                            'amount' => $paymentAmount,
                        ]);

                        // Confirm payment using service logic (this will create CashOut and update bank balance)
                        $this->confirmPurchasePayment($payment);

                        $processed++;

                        DB::commit();

                        // Free memory
                        unset($payment, $purchase);

                        if ($processed % 500 === 0) {
                            $this->command->info("Created purchase payments: {$processed} / {$totalPayments}");
                            // Force garbage collection
                            if (function_exists('gc_collect_cycles')) {
                                gc_collect_cycles();
                            }
                        }
                    } catch (\Exception $e) {
                        DB::rollBack();
                        $this->command->warn("Failed to create purchase payment for purchase {$purchase->id}: " . $e->getMessage());
                    }
                }

                return true; // Continue chunking
            });

        $this->command->info("Created purchase payments: {$processed}");
    }

    private function createCashInOut($banks): void
    {
        $bankIds = array_column($banks, 'id');
        $totalCashIn = 5000;
        $totalCashOut = 5000;
        $batchSize = 100; // Process in batches

        // Get income and expense accounts
        $incomeAccounts = DB::table('chart_of_accounts')
            ->whereIn('type', ['income', 'revenue', 'pendapatan'])
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

        $expenseAccounts = DB::table('chart_of_accounts')
            ->whereIn('type', ['expense', 'biaya', 'pengeluaran'])
            ->where('is_active', true)
            ->where(function($q) {
                $q->where('code', '<', '5100')
                  ->orWhere('code', '>=', '5200');
            })
            ->pluck('id')
            ->toArray();

        if (empty($incomeAccounts) || empty($expenseAccounts)) {
            $this->command->warn('Income or expense accounts not found. Skipping cash in/out.');
            return;
        }

        // Create Cash In using service
        $this->command->info('Creating cash in transactions...');
        $cashInController = app(\App\Http\Controllers\CashInController::class);

        for ($i = 0; $i < $totalCashIn; $i += $batchSize) {
            $currentBatch = min($batchSize, $totalCashIn - $i);
            $cashIns = [];

            for ($j = 0; $j < $currentBatch; $j++) {
                $date = Carbon::now()->subDays(rand(0, 365));
                $dateStr = $date->format('Ymd');

                $lastCashIn = DB::table('cash_ins')
                    ->where('cash_in_number', 'like', 'CI' . $dateStr . '%')
                    ->orderBy('cash_in_number', 'desc')
                    ->value('cash_in_number');
                $sequence = $lastCashIn ? (int) substr($lastCashIn, -4) + 1 : 1;
                $cashInNumber = 'CI' . $dateStr . str_pad($sequence, 4, '0', STR_PAD_LEFT);

                $bankId = $bankIds[array_rand($bankIds)];
                $coaId = $incomeAccounts[array_rand($incomeAccounts)];
                $amount = rand(100000, 10000000);

                // Create as pending first, then post using service
                $cashIn = CashIn::create([
                    'cash_in_number' => $cashInNumber,
                    'cash_in_date' => $date,
                    'bank_id' => $bankId,
                    'chart_of_account_id' => $coaId,
                    'amount' => $amount,
                    'description' => "Kas Masuk #{$cashInNumber}",
                    'status' => 'draft',
                ]);

                // Post using service (this will create journal and cash movement)
                try {
                    $journalService = app(\App\Services\JournalService::class);
                    $journalService->postCashIn($cashIn);
                } catch (\Exception $e) {
                    $this->command->warn("Failed to post cash in {$cashInNumber}: " . $e->getMessage());
                }
            }

            if (($i + $currentBatch) % 1000 === 0) {
                $this->command->info("Created cash in: " . ($i + $currentBatch) . " / {$totalCashIn}");
                if (function_exists('gc_collect_cycles')) {
                    gc_collect_cycles();
                }
            }
        }

        // Create Cash Out using service
        $this->command->info('Creating cash out transactions...');
        $cashOutController = app(\App\Http\Controllers\CashOutController::class);

        for ($i = 0; $i < $totalCashOut; $i += $batchSize) {
            $currentBatch = min($batchSize, $totalCashOut - $i);

            for ($j = 0; $j < $currentBatch; $j++) {
                $date = Carbon::now()->subDays(rand(0, 365));
                $dateStr = $date->format('Ymd');

                $lastCashOut = DB::table('cash_outs')
                    ->where('cash_out_number', 'like', 'CO' . $dateStr . '%')
                    ->orderBy('cash_out_number', 'desc')
                    ->value('cash_out_number');
                $sequence = $lastCashOut ? (int) substr($lastCashOut, -4) + 1 : 1;
                $cashOutNumber = 'CO' . $dateStr . str_pad($sequence, 4, '0', STR_PAD_LEFT);

                $bankId = $bankIds[array_rand($bankIds)];
                $coaId = $expenseAccounts[array_rand($expenseAccounts)];
                $amount = rand(50000, 5000000);

                // Create as pending first, then post using service
                $cashOut = CashOut::create([
                    'cash_out_number' => $cashOutNumber,
                    'cash_out_date' => $date,
                    'bank_id' => $bankId,
                    'chart_of_account_id' => $coaId,
                    'amount' => $amount,
                    'description' => "Kas Keluar #{$cashOutNumber}",
                    'status' => 'draft',
                ]);

                // Post using service (this will create journal and cash movement)
                try {
                    $journalService = app(\App\Services\JournalService::class);
                    $journalService->postCashOut($cashOut);
                } catch (\Exception $e) {
                    $this->command->warn("Failed to post cash out {$cashOutNumber}: " . $e->getMessage());
                }
            }

            if (($i + $currentBatch) % 1000 === 0) {
                $this->command->info("Created cash out: " . ($i + $currentBatch) . " / {$totalCashOut}");
                if (function_exists('gc_collect_cycles')) {
                    gc_collect_cycles();
                }
            }
        }
    }

    /**
     * Confirm sale payment (extracted from SalePaymentController)
     */
    private function confirmSalePayment($salePayment): void
    {
        DB::transaction(function () use ($salePayment) {
            $salePayment->update(['status' => 'confirmed']);

            // Create cash in record if bank is selected
            if ($salePayment->bank_id) {
                $receivableAccount = DB::table('chart_of_accounts')
                    ->where('code', '1201')
                    ->where('is_active', true)
                    ->first();

                if (!$receivableAccount) {
                    $receivableAccount = DB::table('chart_of_accounts')
                        ->whereIn('type', ['asset', 'piutang'])
                        ->where('is_active', true)
                        ->orderBy('code')
                        ->first();
                }

                if ($receivableAccount) {
                    $cashIn = CashIn::create([
                        'cash_in_number' => CashIn::generateCashInNumber(),
                        'cash_in_date' => $salePayment->payment_date,
                        'bank_id' => $salePayment->bank_id,
                        'chart_of_account_id' => $receivableAccount->id,
                        'amount' => $salePayment->total_amount,
                        'description' => "Pembayaran Penjualan #{$salePayment->payment_number}",
                        'status' => 'draft',
                        'reference_type' => 'SalePayment',
                        'reference_id' => $salePayment->id,
                    ]);

                    // Post to journal (this will also update bank balance and create cash movement)
                    app(\App\Services\JournalService::class)->postCashIn($cashIn);
                } else {
                    // If no receivable account found, still create cash movement
                    $bank = \App\Models\Bank::lockForUpdate()->find($salePayment->bank_id);
                    if ($bank) {
                        app(\App\Services\CashMovementService::class)->createMovement(
                            $bank,
                            'SalePayment',
                            $salePayment->id,
                            $salePayment->payment_date,
                            (float) $salePayment->total_amount,
                            0,
                            "Pembayaran Penjualan #{$salePayment->payment_number}"
                        );
                    }
                }
            }
        });
    }

    /**
     * Confirm purchase payment (extracted from PurchasePaymentController)
     */
    private function confirmPurchasePayment($purchasePayment): void
    {
        DB::transaction(function () use ($purchasePayment) {
            $purchasePayment->update(['status' => 'confirmed']);

            // Create cash out record if bank is selected
            if ($purchasePayment->bank_id) {
                $payableAccount = DB::table('chart_of_accounts')
                    ->where('code', '2101')
                    ->where('is_active', true)
                    ->first();

                if (!$payableAccount) {
                    $payableAccount = DB::table('chart_of_accounts')
                        ->whereIn('type', ['liability', 'hutang'])
                        ->where('is_active', true)
                        ->orderBy('code')
                        ->first();
                }

                if ($payableAccount) {
                    $cashOut = CashOut::create([
                        'cash_out_number' => CashOut::generateCashOutNumber(),
                        'cash_out_date' => $purchasePayment->payment_date,
                        'bank_id' => $purchasePayment->bank_id,
                        'chart_of_account_id' => $payableAccount->id,
                        'amount' => $purchasePayment->total_amount,
                        'description' => "Pembayaran Pembelian #{$purchasePayment->payment_number}",
                        'status' => 'draft',
                        'reference_type' => 'PurchasePayment',
                        'reference_id' => $purchasePayment->id,
                    ]);

                    // Post to journal (this will also update bank balance and create cash movement)
                    app(\App\Services\JournalService::class)->postCashOut($cashOut);
                } else {
                    // If no payable account found, still create cash movement
                    $bank = \App\Models\Bank::lockForUpdate()->find($purchasePayment->bank_id);
                    if ($bank) {
                        app(\App\Services\CashMovementService::class)->createMovement(
                            $bank,
                            'PurchasePayment',
                            $purchasePayment->id,
                            $purchasePayment->payment_date,
                            0,
                            (float) $purchasePayment->total_amount,
                            "Pembayaran Pembelian #{$purchasePayment->payment_number}"
                        );
                    }
                }
            }
        });
    }
}
