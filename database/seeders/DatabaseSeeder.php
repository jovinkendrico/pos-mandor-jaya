<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Uom;
use App\Models\City;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Bank;
use App\Models\ChartOfAccount;
use App\Models\Item;
use App\Models\ItemUom;
use App\Models\StockMovement;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnDetail;
use App\Models\SaleReturn;
use App\Models\SaleReturnDetail;
use App\Services\ItemService;
use App\Services\StockService;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        DB::transaction(function () {
            $this->seedUsers();
            $this->seedUoms();
            $this->seedCities();
            $this->seedCustomers();
            $this->seedSuppliers();
            $this->seedBanks();
            $this->call(ChartOfAccountSeeder::class);
            $this->seedItems();
            $this->seedPurchases();
            $this->seedSales();
            $this->seedPurchaseReturns();
            $this->seedSaleReturns();
        });
    }

    private function seedUsers(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@mandorjaya.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'kasir@mandorjaya.com'],
            [
                'name' => 'Kasir',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
    }

    private function seedUoms(): void
    {
        $uoms = ['PCS', 'BOX', 'PAK', 'KG', 'GRAM', 'LITER', 'METER', 'ROLL', 'UNIT', 'SET'];

        foreach ($uoms as $uomName) {
            Uom::firstOrCreate(['name' => $uomName]);
        }
    }

    private function seedCities(): void
    {
        $cities = [
            'Jakarta',
            'Bandung',
            'Surabaya',
            'Yogyakarta',
            'Semarang',
            'Medan',
            'Makassar',
            'Palembang',
            'Denpasar',
            'Bekasi',
        ];

        foreach ($cities as $cityName) {
            City::firstOrCreate(['name' => $cityName]);
        }
    }

    private function seedCustomers(): void
    {
        $cities = City::all();
        if ($cities->isEmpty()) {
            return;
        }

        $customers = [
            [
                'name' => 'PT Toko Maju Jaya',
                'address' => 'Jl. Sudirman No. 123',
                'city_id' => $cities->random()->id,
                'phone_number' => '021-12345678',
                'contact_person' => 'Budi Santoso',
            ],
            [
                'name' => 'CV Sumber Rezeki',
                'address' => 'Jl. Gatot Subroto No. 456',
                'city_id' => $cities->random()->id,
                'phone_number' => '021-87654321',
                'contact_person' => 'Siti Nurhaliza',
            ],
            [
                'name' => 'UD Berkah Abadi',
                'address' => 'Jl. Thamrin No. 789',
                'city_id' => $cities->random()->id,
                'phone_number' => '021-11223344',
                'contact_person' => 'Ahmad Hidayat',
            ],
            [
                'name' => 'Toko Sejahtera',
                'address' => 'Jl. Merdeka No. 321',
                'city_id' => $cities->random()->id,
                'phone_number' => '021-55667788',
                'contact_person' => 'Dewi Sartika',
            ],
            [
                'name' => 'PT Mitra Usaha',
                'address' => 'Jl. Asia Afrika No. 654',
                'city_id' => $cities->random()->id,
                'phone_number' => '021-99887766',
                'contact_person' => 'Rudi Hartono',
            ],
        ];

        foreach ($customers as $customer) {
            Customer::firstOrCreate(
                ['name' => $customer['name']],
                $customer
            );
        }
    }

    private function seedSuppliers(): void
    {
        $cities = City::all();
        if ($cities->isEmpty()) {
            return;
        }

        $suppliers = [
            [
                'name' => 'PT Supplier Utama',
                'address' => 'Jl. Industri No. 100',
                'city_id' => $cities->random()->id,
                'phone_number' => '021-11111111',
                'contact_person' => 'Joko Widodo',
            ],
            [
                'name' => 'CV Distributor Sejahtera',
                'address' => 'Jl. Raya Bogor No. 200',
                'city_id' => $cities->random()->id,
                'phone_number' => '021-22222222',
                'contact_person' => 'Susi Susanti',
            ],
            [
                'name' => 'UD Grosir Makmur',
                'address' => 'Jl. Pasar Minggu No. 300',
                'city_id' => $cities->random()->id,
                'phone_number' => '021-33333333',
                'contact_person' => 'Bambang Pamungkas',
            ],
            [
                'name' => 'PT Importir Barang',
                'address' => 'Jl. Tanah Abang No. 400',
                'city_id' => $cities->random()->id,
                'phone_number' => '021-44444444',
                'contact_person' => 'Lukman Hakim',
            ],
            [
                'name' => 'CV Pemasok Terpercaya',
                'address' => 'Jl. Mangga Dua No. 500',
                'city_id' => $cities->random()->id,
                'phone_number' => '021-55555555',
                'contact_person' => 'Rina Wati',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::firstOrCreate(
                ['name' => $supplier['name']],
                $supplier
            );
        }
    }

    private function seedBanks(): void
    {
        // Get COA for cash and bank (using child accounts)
        $kasKecilCoa = ChartOfAccount::where('code', '1101')->first();
        $bankBcaCoa = ChartOfAccount::where('code', '1103')->first();
        $bankMandiriCoa = ChartOfAccount::where('code', '1104')->first();

        $banks = [
            [
                'name' => 'Bank BCA',
                'type' => 'bank',
                'chart_of_account_id' => $bankBcaCoa?->id,
                'account_number' => '1234567890',
                'account_name' => 'PT Mandor Jaya',
                'balance' => 50000000.00,
                'description' => 'Rekening utama perusahaan',
            ],
            [
                'name' => 'Bank Mandiri',
                'type' => 'bank',
                'chart_of_account_id' => $bankMandiriCoa?->id,
                'account_number' => '0987654321',
                'account_name' => 'PT Mandor Jaya',
                'balance' => 30000000.00,
                'description' => 'Rekening operasional',
            ],
            [
                'name' => 'Kas Kecil',
                'type' => 'cash',
                'chart_of_account_id' => $kasKecilCoa?->id,
                'account_number' => null,
                'account_name' => null,
                'balance' => 5000000.00,
                'description' => 'Kas kecil untuk transaksi harian',
            ],
        ];

        foreach ($banks as $bank) {
            $existingBank = Bank::where('name', $bank['name'])->where('type', $bank['type'])->first();
            if ($existingBank) {
                // Update existing bank with COA if not set
                if (!$existingBank->chart_of_account_id) {
                    $existingBank->update(['chart_of_account_id' => $bank['chart_of_account_id']]);
                }
            } else {
                Bank::create($bank);
            }
        }
    }

    private function seedItems(): void
    {
        $uoms = Uom::all();
        if ($uoms->isEmpty()) {
            return;
        }

        $baseUom = $uoms->where('name', 'PCS')->first() ?? $uoms->first();
        $boxUom = $uoms->where('name', 'BOX')->first();
        $pakUom = $uoms->where('name', 'PAK')->first();

        $items = [
            [
                'name' => 'Pensil 2B',
                'description' => 'Pensil 2B Faber Castell',
                'stock' => 500,
                'modal_price' => 2000.00,
                'uoms' => [
                    [
                        'uom_id' => $baseUom->id,
                        'conversion_value' => 1,
                        'price' => 3000.00,
                        'is_base' => true,
                    ],
                    ...($boxUom ? [[
                        'uom_id' => $boxUom->id,
                        'conversion_value' => 12,
                        'price' => 33000.00,
                        'is_base' => false,
                    ]] : []),
                ],
            ],
            [
                'name' => 'Buku Tulis 38 Lembar',
                'description' => 'Buku tulis isi 38 lembar merk Sinar Dunia',
                'stock' => 200,
                'modal_price' => 2500.00,
                'uoms' => [
                    [
                        'uom_id' => $baseUom->id,
                        'conversion_value' => 1,
                        'price' => 4000.00,
                        'is_base' => true,
                    ],
                    ...($pakUom ? [[
                        'uom_id' => $pakUom->id,
                        'conversion_value' => 10,
                        'price' => 35000.00,
                        'is_base' => false,
                    ]] : []),
                ],
            ],
            [
                'name' => 'Spidol Permanent',
                'description' => 'Spidol permanent Snowman warna hitam',
                'stock' => 100,
                'modal_price' => 5000.00,
                'uoms' => [
                    [
                        'uom_id' => $baseUom->id,
                        'conversion_value' => 1,
                        'price' => 8000.00,
                        'is_base' => true,
                    ],
                ],
            ],
            [
                'name' => 'Penghapus',
                'description' => 'Penghapus Faber Castell',
                'stock' => 300,
                'modal_price' => 1500.00,
                'uoms' => [
                    [
                        'uom_id' => $baseUom->id,
                        'conversion_value' => 1,
                        'price' => 2500.00,
                        'is_base' => true,
                    ],
                ],
            ],
            [
                'name' => 'Penggaris 30cm',
                'description' => 'Penggaris plastik 30cm',
                'stock' => 150,
                'modal_price' => 3000.00,
                'uoms' => [
                    [
                        'uom_id' => $baseUom->id,
                        'conversion_value' => 1,
                        'price' => 5000.00,
                        'is_base' => true,
                    ],
                ],
            ],
            [
                'name' => 'Stapler',
                'description' => 'Stapler kecil merk Joyko',
                'stock' => 50,
                'modal_price' => 15000.00,
                'uoms' => [
                    [
                        'uom_id' => $baseUom->id,
                        'conversion_value' => 1,
                        'price' => 25000.00,
                        'is_base' => true,
                    ],
                ],
            ],
            [
                'name' => 'Isi Stapler',
                'description' => 'Isi stapler ukuran standar',
                'stock' => 1000,
                'modal_price' => 5000.00,
                'uoms' => [
                    [
                        'uom_id' => $baseUom->id,
                        'conversion_value' => 1,
                        'price' => 8000.00,
                        'is_base' => true,
                    ],
                ],
            ],
            [
                'name' => 'Kertas A4',
                'description' => 'Kertas HVS A4 70gr',
                'stock' => 100,
                'modal_price' => 45000.00,
                'uoms' => [
                    [
                        'uom_id' => $pakUom ? $pakUom->id : $baseUom->id,
                        'conversion_value' => 1,
                        'price' => 55000.00,
                        'is_base' => true,
                    ],
                ],
            ],
            [
                'name' => 'Map Kertas',
                'description' => 'Map kertas warna',
                'stock' => 200,
                'modal_price' => 2000.00,
                'uoms' => [
                    [
                        'uom_id' => $baseUom->id,
                        'conversion_value' => 1,
                        'price' => 3500.00,
                        'is_base' => true,
                    ],
                ],
            ],
            [
                'name' => 'Binder Clip',
                'description' => 'Binder clip ukuran besar',
                'stock' => 500,
                'modal_price' => 1000.00,
                'uoms' => [
                    [
                        'uom_id' => $baseUom->id,
                        'conversion_value' => 1,
                        'price' => 2000.00,
                        'is_base' => true,
                    ],
                ],
            ],
        ];

        foreach ($items as $itemData) {
            // Check if item already exists by name
            $item = Item::where('name', $itemData['name'])->first();
            $isNewItem = false;

            if (!$item) {
                $code = ItemService::generateCode();
                $item = Item::create([
                    'code' => $code,
                    'name' => $itemData['name'],
                    'stock' => $itemData['stock'],
                    'description' => $itemData['description'],
                ]);
                $isNewItem = true;
            } else {
                // Update description if it's empty
                if (empty($item->description)) {
                    $item->update(['description' => $itemData['description']]);
                }
            }

            // Create ItemUoms
            foreach ($itemData['uoms'] as $uomData) {
                ItemUom::firstOrCreate(
                    [
                        'item_id' => $item->id,
                        'uom_id' => $uomData['uom_id'],
                    ],
                    [
                        'conversion_value' => $uomData['conversion_value'],
                        'price' => $uomData['price'],
                        'is_base' => $uomData['is_base'],
                    ]
                );
            }

            // Create initial stock movement only for new items
            if ($isNewItem && $itemData['stock'] > 0 && $itemData['modal_price'] > 0) {
                StockMovement::create([
                    'item_id' => $item->id,
                    'reference_type' => 'OpeningBalance',
                    'reference_id' => $item->id,
                    'quantity' => $itemData['stock'],
                    'unit_cost' => $itemData['modal_price'],
                    'remaining_quantity' => $itemData['stock'],
                    'movement_date' => now(),
                    'notes' => 'Opening balance - Seeded data',
                ]);
            }
        }
    }

    private function seedPurchases(): void
    {
        $suppliers = Supplier::all();
        $items = Item::with('itemUoms')->get();

        if ($suppliers->isEmpty() || $items->isEmpty()) {
            return;
        }

        $stockService = app(StockService::class);

        // Create 3 purchases with different dates to test FIFO
        $purchaseDates = [
            now()->subDays(30), // 30 days ago
            now()->subDays(15), // 15 days ago
            now()->subDays(5),  // 5 days ago
        ];

        foreach ($purchaseDates as $index => $purchaseDate) {
            $supplier = $suppliers->random();
            $purchaseNumber = Purchase::generatePurchaseNumber();

            // Select random items for this purchase
            $selectedItems = $items->random(min(3, $items->count()));

            $subtotal = 0;
            $purchase = Purchase::create([
                'purchase_number' => $purchaseNumber,
                'supplier_id' => $supplier->id,
                'purchase_date' => $purchaseDate,
                'due_date' => $purchaseDate->copy()->addDays(30),
                'subtotal' => 0,
                'discount1_percent' => 0,
                'discount1_amount' => 0,
                'discount2_percent' => 0,
                'discount2_amount' => 0,
                'total_after_discount' => 0,
                'ppn_percent' => 11,
                'ppn_amount' => 0,
                'total_amount' => 0,
                'status' => 'pending',
                'notes' => sprintf('Purchase seeder #%d', $index + 1),
            ]);

            foreach ($selectedItems as $item) {
                $baseUom = $item->itemUoms->where('is_base', true)->first();
                if (!$baseUom) {
                    continue;
                }

                // Purchase price is lower than selling price (modal price)
                $purchasePrice = $baseUom->price * 0.7; // 70% of selling price
                $quantity = rand(10, 50);
                $detailSubtotal = $quantity * $purchasePrice;

                PurchaseDetail::create([
                    'purchase_id' => $purchase->id,
                    'item_id' => $item->id,
                    'item_uom_id' => $baseUom->id,
                    'quantity' => $quantity,
                    'price' => $purchasePrice,
                    'discount1_percent' => 0,
                    'discount1_amount' => 0,
                    'discount2_percent' => 0,
                    'discount2_amount' => 0,
                    'subtotal' => $detailSubtotal,
                ]);

                $subtotal += $detailSubtotal;
            }

            $totalAfterDiscount = $subtotal;
            $ppnAmount = $totalAfterDiscount * 0.11;
            $totalAmount = $totalAfterDiscount + $ppnAmount;

            $purchase->update([
                'subtotal' => $subtotal,
                'total_after_discount' => $totalAfterDiscount,
                'ppn_amount' => $ppnAmount,
                'total_amount' => $totalAmount,
            ]);

            // Confirm purchase to create stock movements
            $stockService->confirmPurchase($purchase);
        }
    }

    private function seedSales(): void
    {
        $customers = Customer::all();
        $items = Item::with('itemUoms')->get();

        if ($customers->isEmpty() || $items->isEmpty()) {
            return;
        }

        $stockService = app(StockService::class);

        // Create 5 sales with different dates
        $saleDates = [
            now()->subDays(25), // 25 days ago
            now()->subDays(20), // 20 days ago
            now()->subDays(12), // 12 days ago
            now()->subDays(8),  // 8 days ago
            now()->subDays(3),  // 3 days ago
        ];

        foreach ($saleDates as $index => $saleDate) {
            $customer = $customers->random();
            $saleNumber = Sale::generateSaleNumber();

            // Select random items for this sale
            $selectedItems = $items->random(min(2, $items->count()));

            $subtotal = 0;
            $sale = Sale::create([
                'sale_number' => $saleNumber,
                'customer_id' => $customer->id,
                'sale_date' => $saleDate,
                'due_date' => $saleDate->copy()->addDays(14),
                'subtotal' => 0,
                'discount1_percent' => 0,
                'discount1_amount' => 0,
                'discount2_percent' => 0,
                'discount2_amount' => 0,
                'total_after_discount' => 0,
                'ppn_percent' => 11,
                'ppn_amount' => 0,
                'total_amount' => 0,
                'total_cost' => 0,
                'total_profit' => 0,
                'status' => 'pending',
                'notes' => sprintf('Sale seeder #%d', $index + 1),
            ]);

            foreach ($selectedItems as $item) {
                $baseUom = $item->itemUoms->where('is_base', true)->first();
                if (!$baseUom) {
                    continue;
                }

                // Check if item has enough stock
                $quantity = rand(5, min(20, (int) $item->stock));
                if ($quantity <= 0) {
                    continue;
                }

                $sellingPrice = $baseUom->price;
                $detailSubtotal = $quantity * $sellingPrice;

                SaleDetail::create([
                    'sale_id' => $sale->id,
                    'item_id' => $item->id,
                    'item_uom_id' => $baseUom->id,
                    'quantity' => $quantity,
                    'price' => $sellingPrice,
                    'discount1_percent' => 0,
                    'discount1_amount' => 0,
                    'discount2_percent' => 0,
                    'discount2_amount' => 0,
                    'subtotal' => $detailSubtotal,
                    'cost' => 0, // Will be calculated on confirm
                    'profit' => 0, // Will be calculated on confirm
                ]);

                $subtotal += $detailSubtotal;
            }

            if ($subtotal > 0) {
                $totalAfterDiscount = $subtotal;
                $ppnAmount = $totalAfterDiscount * 0.11;
                $totalAmount = $totalAfterDiscount + $ppnAmount;

                $sale->update([
                    'subtotal' => $subtotal,
                    'total_after_discount' => $totalAfterDiscount,
                    'ppn_amount' => $ppnAmount,
                    'total_amount' => $totalAmount,
                ]);

                // Confirm sale to calculate FIFO cost and profit
                try {
                    $stockService->confirmSale($sale);
                } catch (\Exception $e) {
                    // If stock is insufficient, skip this sale
                    $sale->delete();
                }
            } else {
                $sale->delete();
            }
        }
    }

    private function seedPurchaseReturns(): void
    {
        $purchases = Purchase::where('status', 'confirmed')
            ->with(['details.item', 'details.itemUom'])
            ->get();

        if ($purchases->isEmpty()) {
            return;
        }

        $stockService = app(StockService::class);

        // Create 1 purchase return
        $purchase = $purchases->random();
        $returnNumber = PurchaseReturn::generateReturnNumber();
        $returnDate = now()->subDays(2);

        $subtotal = 0;
        $purchaseReturn = PurchaseReturn::create([
            'return_number' => $returnNumber,
            'purchase_id' => $purchase->id,
            'return_date' => $returnDate,
            'subtotal' => 0,
            'discount1_percent' => 0,
            'discount1_amount' => 0,
            'discount2_percent' => 0,
            'discount2_amount' => 0,
            'total_after_discount' => 0,
            'ppn_percent' => 11,
            'ppn_amount' => 0,
            'total_amount' => 0,
            'status' => 'pending',
            'reason' => 'Barang rusak/defect',
        ]);

        // Return 1 item from the purchase
        $purchaseDetail = $purchase->details->first();
        if ($purchaseDetail) {
            $returnQuantity = min(5, $purchaseDetail->quantity);
            $returnSubtotal = $returnQuantity * $purchaseDetail->price;

            PurchaseReturnDetail::create([
                'purchase_return_id' => $purchaseReturn->id,
                'purchase_detail_id' => $purchaseDetail->id,
                'item_id' => $purchaseDetail->item_id,
                'item_uom_id' => $purchaseDetail->item_uom_id,
                'quantity' => $returnQuantity,
                'price' => $purchaseDetail->price,
                'discount1_percent' => 0,
                'discount1_amount' => 0,
                'discount2_percent' => 0,
                'discount2_amount' => 0,
                'subtotal' => $returnSubtotal,
            ]);

            $subtotal = $returnSubtotal;
        }

        if ($subtotal > 0) {
            $totalAfterDiscount = $subtotal;
            $ppnAmount = $totalAfterDiscount * 0.11;
            $totalAmount = $totalAfterDiscount + $ppnAmount;

            $purchaseReturn->update([
                'subtotal' => $subtotal,
                'total_after_discount' => $totalAfterDiscount,
                'ppn_amount' => $ppnAmount,
                'total_amount' => $totalAmount,
            ]);

            // Confirm purchase return
            try {
                $stockService->confirmPurchaseReturn($purchaseReturn);
            } catch (\Exception $e) {
                $purchaseReturn->delete();
            }
        } else {
            $purchaseReturn->delete();
        }
    }

    private function seedSaleReturns(): void
    {
        $sales = Sale::where('status', 'confirmed')
            ->with(['details.item', 'details.itemUom', 'details.fifoMappings'])
            ->get();

        if ($sales->isEmpty()) {
            return;
        }

        $stockService = app(StockService::class);

        // Create 1 sale return
        $sale = $sales->random();
        $returnNumber = SaleReturn::generateReturnNumber();
        $returnDate = now()->subDays(1);

        $subtotal = 0;
        $saleReturn = SaleReturn::create([
            'return_number' => $returnNumber,
            'sale_id' => $sale->id,
            'return_date' => $returnDate,
            'subtotal' => 0,
            'discount1_percent' => 0,
            'discount1_amount' => 0,
            'discount2_percent' => 0,
            'discount2_amount' => 0,
            'total_after_discount' => 0,
            'ppn_percent' => 11,
            'ppn_amount' => 0,
            'total_amount' => 0,
            'total_cost' => 0,
            'total_profit_adjustment' => 0,
            'status' => 'pending',
            'reason' => 'Barang tidak sesuai pesanan',
        ]);

        // Return 1 item from the sale
        $saleDetail = $sale->details->first();
        if ($saleDetail) {
            $returnQuantity = min(2, $saleDetail->quantity);
            $returnSubtotal = $returnQuantity * $saleDetail->price;

            SaleReturnDetail::create([
                'sale_return_id' => $saleReturn->id,
                'sale_detail_id' => $saleDetail->id,
                'item_id' => $saleDetail->item_id,
                'item_uom_id' => $saleDetail->item_uom_id,
                'quantity' => $returnQuantity,
                'price' => $saleDetail->price,
                'discount1_percent' => 0,
                'discount1_amount' => 0,
                'discount2_percent' => 0,
                'discount2_amount' => 0,
                'subtotal' => $returnSubtotal,
                'cost' => 0, // Will be calculated on confirm
                'profit_adjustment' => 0, // Will be calculated on confirm
            ]);

            $subtotal = $returnSubtotal;
        }

        if ($subtotal > 0) {
            $totalAfterDiscount = $subtotal;
            $ppnAmount = $totalAfterDiscount * 0.11;
            $totalAmount = $totalAfterDiscount + $ppnAmount;

            $saleReturn->update([
                'subtotal' => $subtotal,
                'total_after_discount' => $totalAfterDiscount,
                'ppn_amount' => $ppnAmount,
                'total_amount' => $totalAmount,
            ]);

            // Confirm sale return
            try {
                $stockService->confirmSaleReturn($saleReturn);
            } catch (\Exception $e) {
                $saleReturn->delete();
            }
        } else {
            $saleReturn->delete();
        }
    }
}
