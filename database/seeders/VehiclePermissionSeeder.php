<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class VehiclePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            ['name' => 'vehicles.index', 'group' => 'Master Kendaraan'],
            ['name' => 'vehicles.create', 'group' => 'Master Kendaraan'],
            ['name' => 'vehicles.edit', 'group' => 'Master Kendaraan'],
            ['name' => 'vehicles.delete', 'group' => 'Master Kendaraan'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name'], 'guard_name' => 'web'],
                ['group' => $permission['group']]
            );
        }

        // Get Super Admin role
        $superAdmin = Role::where('name', 'Super Admin')->first();
        if ($superAdmin) {
            $superAdmin->givePermissionTo(collect($permissions)->pluck('name'));
        }

        // Get Admin role
        $admin = Role::where('name', 'Admin')->first();
        if ($admin) {
            $admin->givePermissionTo(collect($permissions)->pluck('name'));
        }
    }
}
