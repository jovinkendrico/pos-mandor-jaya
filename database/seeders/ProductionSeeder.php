<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class ProductionSeeder extends Seeder
{
    /**
     * Seed the application's database for production/clean start.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // 1. Seed Roles and Permissions
            $this->call(RoleSeeder::class);

            // 2. Seed Basic Users
            $this->seedUsers();

            // 3. Seed Chart of Accounts
            $this->call(ChartOfAccountSeeder::class);
            
            // 4. Seed Additional COAs if any
            if (class_exists(AdditionalCoaSeeder::class)) {
                $this->call(AdditionalCoaSeeder::class);
            }
        });
    }

    private function seedUsers(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@mandorjaya.com'],
            [
                'name'              => 'Administrator',
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Assign Super Admin role if it exists
        $superAdminRole = Role::where('name', 'Super Admin')->first();
        if ($superAdminRole) {
            $admin->assignRole($superAdminRole);
        }

        $kasir = User::firstOrCreate(
            ['email' => 'kasir@mandorjaya.com'],
            [
                'name'              => 'Kasir',
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        
        // Assign Admin role to kasir for now (or a specific role if needed)
        $adminRole = Role::where('name', 'Admin')->first();
        if ($adminRole) {
            $kasir->assignRole($adminRole);
        }
    }
}
