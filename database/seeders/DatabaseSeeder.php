<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Uom;
use App\Models\Item;
use App\Models\ItemUom;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Seed UOMs
        $uom = Uom::firstOrCreate(['name' => 'pcs']);

        // Seed Items + price + base stock = stock movement (HPP = unit_cost)
        $items = [
            [
                'code' => 'BRG001',
                'name' => 'Pensil',
                'description' => 'Pensil 2B',
                'stock' => 100,
                'price' => 2500.00,
            ],
            [
                'code' => 'BRG002',
                'name' => 'Buku Tulis',
                'description' => 'Buku isi 38',
                'stock' => 30,
                'price' => 3500.00,
            ],
            [
                'code' => 'BRG003',
                'name' => 'Spidol',
                'description' => 'Spidol Snowman',
                'stock' => 15,
                'price' => 8000.00,
            ],
        ];
        DB::transaction(function () use ($items, $uom) {
            foreach ($items as $seed) {
                $item = Item::firstOrCreate([
                    'code' => $seed['code'],
                ], [
                    'name' => $seed['name'],
                    'uom_id' => $uom->id,
                    'stock' => $seed['stock'],
                    'description' => $seed['description'],
                ]);
                // Create base UOM for item with price
                $itemUom = ItemUom::firstOrCreate([
                    'item_id' => $item->id,
                    'uom_id' => $uom->id,
                ], [
                    'uom_name' => $uom->name,
                    'conversion_value' => 1,
                    'price' => $seed['price'],
                    'is_base' => true,
                ]);
                // Create stock movement for initial stock (reference_type: 'Seeder', id: 0)
                StockMovement::create([
                    'item_id' => $item->id,
                    'reference_type' => 'Seeder',
                    'reference_id' => 0,
                    'quantity' => $seed['stock'],
                    'unit_cost' => $seed['price'],
                    'remaining_quantity' => $seed['stock'],
                    'movement_date' => now(),
                    'notes' => 'Initial stock seeded',
                ]);
            }
        });
    }
}
