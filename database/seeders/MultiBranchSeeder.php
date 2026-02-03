<?php

namespace Database\Seeders;

use App\Models\Branch;
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
use App\Models\ItemStock;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\Transfer;
use App\Models\TransferDetail;
use App\Services\StockService;
use App\Services\ItemService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Schema;

class MultiBranchSeeder extends Seeder
{
    public function run(): void
    {
        // Disable foreign key checks
        Schema::disableForeignKeyConstraints();

        // Truncate tables
        $tables = [
            'branches', 'users', 'uoms', 'cities', 'customers', 'suppliers', 
            'banks', 'chart_of_accounts', 'items', 'item_uoms', 'item_stocks',
            'stock_movements', 'purchases', 'purchase_details', 'sales', 'sale_details',
            'purchase_returns', 'purchase_return_details', 'sale_returns', 'sale_return_details',
            'transfers', 'transfer_details', 'fifo_mappings', 'journal_entries', 'journal_entry_details',
            'cash_movements', 'cash_ins', 'cash_outs', 'purchase_payments', 'sale_payments',
            'model_has_roles', 'model_has_permissions', 'roles', 'permissions'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
            }
        }

        Schema::enableForeignKeyConstraints();

        DB::transaction(function () {
            $this->seedRolesAndPermissions();
            $this->seedBranches();
            $this->seedUsers();
            $this->seedUoms();
            $this->seedCities();
            $this->seedCustomers(); // Global
            $this->seedSuppliers(); // Global
            $this->call(ChartOfAccountSeeder::class); // Global COA
            $this->seedBanks(); // Branch specific
            $this->seedBanks(); // Branch specific
            $this->seedItemsAndStock();
            //$this->seedTransactions();
        });
    }

    private function seedPermissions(string $roleName): void 
    {
        // Simple permission seeding for testing (assuming RoleSeeder logic or just assigning all to SuperAdmin)
        // In this implementation, we rely on RoleSeeder logic if available, or just create roles.
        // For simplicity here, we assume SuperAdmin has all access.
    }

    private function seedRolesAndPermissions(): void
    {
        // Call existing RoleSeeder if it exists and works, or create manually
        $this->call(RoleSeeder::class);
        
        // Ensure roles exist if seeder didn't create them
        Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Branch Manager', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Cashier', 'guard_name' => 'web']);
    }

    private function seedBranches(): void
    {
        Branch::create([
            'code' => 'PST',
            'name' => 'Pusat (Headquarters)',
            'address' => 'Jl. Jendral Sudirman No. 1, Jakarta',
            'phone' => '021-12345678',
            'is_active' => true,
            'is_head_office' => true,
        ]);

        Branch::create([
            'code' => 'CB1',
            'name' => 'Cabang Surabaya',
            'address' => 'Jl. Tunjungan No. 25, Surabaya',
            'phone' => '031-87654321',
            'is_active' => true,
        ]);
        
        Branch::create([
            'code' => 'CB2',
            'name' => 'Cabang Bandung',
            'address' => 'Jl. Braga No. 10, Bandung',
            'phone' => '022-11223344',
            'is_active' => true,
        ]);
    }

    private function seedUsers(): void
    {
        $pusat = Branch::where('code', 'PST')->first();
        $cabang1 = Branch::where('code', 'CB1')->first();
        $cabang2 = Branch::where('code', 'CB2')->first();

        // Super Admin (Pusat)
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@mandorjaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'branch_id' => $pusat->id,
        ]);
        $admin->assignRole('Super Admin');

        // Manager Cabang 1
        $manager1 = User::create([
            'name' => 'Budi Manager (SBY)',
            'email' => 'manager.sby@mandorjaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'branch_id' => $cabang1->id,
        ]);
        $manager1->assignRole('Branch Manager');

        // Cashier Cabang 1
        $cashier1 = User::create([
            'name' => 'Siti Kasir (SBY)',
            'email' => 'kasir.sby@mandorjaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'branch_id' => $cabang1->id,
        ]);
        $cashier1->assignRole('Cashier');
        
        // Manager Cabang 2
        $manager2 = User::create([
            'name' => 'Andi Manager (BDG)',
            'email' => 'manager.bdg@mandorjaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'branch_id' => $cabang2->id,
        ]);
        $manager2->assignRole('Branch Manager');
    }

    // --- Reuse logic from DatabaseSeeder for master data ---
    private function seedUoms(): void
    {
        $uoms = ['PCS', 'BOX', 'PAK', 'KG'];
        foreach ($uoms as $uomName) {
            Uom::firstOrCreate(['name' => $uomName]);
        }
    }

    private function seedCities(): void
    {
        $cities = ['Jakarta', 'Surabaya', 'Bandung'];
        foreach ($cities as $cityName) {
            City::firstOrCreate(['name' => $cityName]);
        }
    }

    private function seedCustomers(): void
    {
        $cities = City::all();
        Customer::create(['name' => 'Customer Umum', 'address' => 'N/A', 'city_id' => $cities->first()->id]);
        Customer::create(['name' => 'Toko Sejahtera (SBY)', 'address' => 'Jl. Darmo', 'city_id' => $cities->where('name', 'Surabaya')->first()->id]);
    }

    private function seedSuppliers(): void
    {
        $cities = City::all();
        Supplier::create(['name' => 'Supplier Utama (JKT)', 'address' => 'Jl. Mangga Dua', 'city_id' => $cities->first()->id]);
        Supplier::create(['name' => 'Grosir ATK (SBY)', 'address' => 'Jl. Pasar Turi', 'city_id' => $cities->where('name', 'Surabaya')->first()->id]);
    }
    
    private function seedBanks(): void
    {
        // Create banks for each branch
        $branches = Branch::all();
        $bankCoa = ChartOfAccount::where('code', '1103')->first(); // Bank BCA
        $cashCoa = ChartOfAccount::where('code', '1101')->first(); // Kas Kecil

        foreach ($branches as $branch) {
            // Cash Account
            Bank::create([
                'name' => "Kas Kecil " . $branch->code,
                'type' => 'cash',
                'chart_of_account_id' => $cashCoa?->id,
                'balance' => 0, // Will be filled by capital injection
                'branch_id' => $branch->id,
            ]);

            // Bank Account
            Bank::create([
                'name' => "Bank BCA - " . $branch->name,
                'type' => 'bank',
                'chart_of_account_id' => $bankCoa?->id,
                'account_number' => '123-' . $branch->code,
                'account_name' => 'PT MandorJaya ' . $branch->code,
                'balance' => 0,
                'branch_id' => $branch->id,
            ]);
        }
    }

    private function seedItemsAndStock(): void
    {
        $pusat = Branch::where('code', 'PST')->first();
        $cabang1 = Branch::where('code', 'CB1')->first();
        
        $uomPcs = Uom::where('name', 'PCS')->first();
        
        // Items
        $itemsData = [
            ['name' => 'Laptop ASUS', 'cost' => 5000000, 'price' => 7000000, 'initial_stock_pusat' => 20, 'initial_stock_cb1' => 5],
            ['name' => 'Mouse Logitech', 'cost' => 50000, 'price' => 100000, 'initial_stock_pusat' => 100, 'initial_stock_cb1' => 20],
            ['name' => 'Keyboard Mechanical', 'cost' => 300000, 'price' => 600000, 'initial_stock_pusat' => 50, 'initial_stock_cb1' => 10],
        ];

        foreach ($itemsData as $data) {
            $code = ItemService::generateCode();
            $item = Item::create([
                'code' => $code,
                'name' => $data['name'],
                'stock' => 0, // Calculated from ItemStock
                'description' => 'Test Item',
            ]);

            // Item UOM
            ItemUom::create([
                'item_id' => $item->id,
                'uom_id' => $uomPcs->id,
                'conversion_value' => 1,
                'price' => $data['price'],
                'is_base' => true,
            ]);
            
            // Seed Stock Pusat
            $this->createStock($item, $pusat, $data['initial_stock_pusat'], $data['cost']);
            
            // Seed Stock Cabang 1
            $this->createStock($item, $cabang1, $data['initial_stock_cb1'], $data['cost']);
        }
    }

    private function createStock($item, $branch, $qty, $cost)
    {
        // 1. Create Opening Balance Movement
        StockMovement::create([
            'item_id' => $item->id,
            'reference_type' => 'OpeningBalance',
            'reference_id' => 0, // System
            'quantity' => $qty,
            'unit_cost' => $cost,
            'remaining_quantity' => $qty,
            'movement_date' => now()->subMonth(),
            'notes' => 'Opening Balance ' . $branch->code,
            'branch_id' => $branch->id,
        ]);

        // 2. Update ItemStock
        $itemStock = ItemStock::firstOrCreate(
            ['branch_id' => $branch->id, 'item_id' => $item->id],
            ['quantity' => 0]
        );
        $itemStock->increment('quantity', $qty);
    }

    private function seedTransactions(): void
    {
         // Authenticate as Admin (Pusat)
        $admin = User::where('email', 'admin@mandorjaya.com')->first();
        $this->actingAs($admin);
        
        // 1. Purchase at Pusat
        $this->createPurchase('PST');

        // 2. Transfer Pusat -> Cabang Surabaya
        $this->createTransfer('PST', 'CB1');

        // Authenticate as Manager Cabang 1
        $manager1 = User::where('email', 'manager.sby@mandorjaya.com')->first();
        $this->actingAs($manager1);
        
        // 3. Sale at Cabang Surabaya
        $this->createSale('CB1');
    }

    private function actingAs($user)
    {
        auth()->login($user);
    }

    private function createPurchase($branchCode)
    {
        $branch = Branch::where('code', $branchCode)->first();
        $supplier = Supplier::first();
        $item = Item::first();
        $uom = $item->itemUoms->where('is_base', true)->first();

        // Use standard model creation instead of service to avoid complex auth dependency in seeder context if possible, 
        // OR use service but we need to mock auth user correctly (which we did with actingAs)
        
        // Since we refactored Number Generation to rely on auth()->user()->branch, actingAs must be called before.
        
        $purchaseNumber = Purchase::generatePurchaseNumber(now()->format('Y-m-d'));
        
        $qty = 10;
        $price = $item->modal_price;
        $subtotal = $qty * $price;
        
        $purchase = Purchase::create([
            'purchase_number' => $purchaseNumber,
            'supplier_id' => $supplier->id,
            'purchase_date' => now(),
            'due_date' => now()->addDays(30),
            'branch_id' => $branch->id,
            'subtotal' => $subtotal,
            'total_after_discount' => $subtotal,
            'ppn_amount' => $subtotal * 0.11,
            'total_amount' => $subtotal * 1.11,
            'status' => 'pending', 
            'created_by' => auth()->id(),
        ]);

        PurchaseDetail::create([
            'purchase_id' => $purchase->id,
            'item_id' => $item->id,
            'item_uom_id' => $uom->id,
            'quantity' => $qty,
            'price' => $price,
            'subtotal' => $subtotal,
            'discount1_percent' => 0, 'discount1_amount' => 0,
            'discount2_percent' => 0, 'discount2_amount' => 0,
        ]);

        app(StockService::class)->confirmPurchase($purchase);
    }

    private function createTransfer($fromCode, $toCode)
    {
        $fromBranch = Branch::where('code', $fromCode)->first();
        $toBranch = Branch::where('code', $toCode)->first();
        $item = Item::first();
        $uom = $item->itemUoms->where('is_base', true)->first();

        $transferNumber = Transfer::generateTransferNumber();

        $transfer = Transfer::create([
            'transfer_number' => $transferNumber,
            'from_branch_id' => $fromBranch->id,
            'to_branch_id' => $toBranch->id,
            'transfer_date' => now(),
            'status' => 'pending',
            'created_by' => auth()->id(),
            'branch_id' => $fromBranch->id, // Origin matches creator's branch
        ]);

        TransferDetail::create([
            'transfer_id' => $transfer->id,
            'item_id' => $item->id,
            'quantity' => 5,
            'uom_id' => $uom->id,
            'notes' => 'Restock',
        ]);

        // Logic to confirm transfer?
        // Usually TransferController handles this. For seeder, we might need TransferService or logic here.
        // Assuming we just leave it pending or manually update logic if simple.
        // Let's leave it as pending to test UI approval.
    }

    private function createSale($branchCode)
    {
        $branch = Branch::where('code', $branchCode)->first();
        $customer = Customer::first();
        $item = Item::where('name', 'Laptop ASUS')->first(); 
        $uom = $item->itemUoms->where('is_base', true)->first();
        
        $saleNumber = Sale::generateSaleNumber(now()->format('Y-m-d'));
        
        $qty = 1;
        $price = $uom->price;
        $subtotal = $qty * $price;

        $sale = Sale::create([
            'sale_number' => $saleNumber,
            'customer_id' => $customer->id,
            'sale_date' => now(),
            'due_date' => now()->addDays(7),
            'branch_id' => $branch->id,
            'subtotal' => $subtotal,
            'total_after_discount' => $subtotal,
            'ppn_amount' => $subtotal * 0.11,
            'total_amount' => $subtotal * 1.11,
            'status' => 'pending',
            'created_by' => auth()->id(),
        ]);

        SaleDetail::create([
            'sale_id' => $sale->id,
            'item_id' => $item->id,
            'item_uom_id' => $uom->id,
            'quantity' => $qty,
            'price' => $price,
            'subtotal' => $subtotal,
            'discount1_percent' => 0, 'discount1_amount' => 0,
            'discount2_percent' => 0, 'discount2_amount' => 0,
        ]);

        app(StockService::class)->confirmSale($sale);
    }
}
