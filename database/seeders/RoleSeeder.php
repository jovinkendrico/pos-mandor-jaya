<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // create permissions with groups
        $permissions = [
            ['name' => 'purchase.create', 'group' => 'purchases'],
            ['name' => 'purchase.edit', 'group' => 'purchases'],
            ['name' => 'sale.create', 'group' => 'sales'],
            ['name' => 'sale.edit', 'group' => 'sales'],
            ['name' => 'price.edit', 'group' => 'finance'],
            ['name' => 'master.create', 'group' => 'master'],
            ['name' => 'master.edit', 'group' => 'master'],
            ['name' => 'master.delete', 'group' => 'master'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                ['group' => $permission['group']] // Only set group if creating new
            );
        }

        // create roles and assign created permissions

        // SUPER ADMIN
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);
        // Super Admin gets all permissions
        $superAdminRole->givePermissionTo(Permission::all());

        // ADMIN
        $adminRole = Role::firstOrCreate(['name' => 'Admin']);
        $adminRole->givePermissionTo([
            'purchase.create',
            'purchase.edit', 
            'sale.create',
            'sale.edit',
            'master.create',
        ]);
        // Admin explicitly does NOT get 'price.edit'

        // Assign Roles to Users
        $superAdminUser = User::where('email', 'admin@mandorjaya.com')->first();
        if ($superAdminUser) {
            $superAdminUser->assignRole($superAdminRole);
        }

        $adminUser = User::where('email', 'kasir@mandorjaya.com')->first();
        if ($adminUser) {
            $adminUser->assignRole($adminRole);
        }
    }
}
