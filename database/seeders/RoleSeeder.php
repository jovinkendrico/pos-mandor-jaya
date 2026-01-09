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
            // Purchases
            ['name' => 'purchases.index', 'group' => 'purchases'],
            ['name' => 'purchases.show', 'group' => 'purchases'],
            ['name' => 'purchases.create', 'group' => 'purchases'],
            ['name' => 'purchases.edit', 'group' => 'purchases'],
            ['name' => 'purchases.delete', 'group' => 'purchases'],
            ['name' => 'purchases.print', 'group' => 'purchases'],

            // Sales
            ['name' => 'sales.index', 'group' => 'sales'],
            ['name' => 'sales.show', 'group' => 'sales'],
            ['name' => 'sales.create', 'group' => 'sales'],
            ['name' => 'sales.edit', 'group' => 'sales'],
            ['name' => 'sales.delete', 'group' => 'sales'],
            ['name' => 'sales.print', 'group' => 'sales'],

            // Purchase Payments
            ['name' => 'purchase-payments.index', 'group' => 'payments'],
            ['name' => 'purchase-payments.show', 'group' => 'payments'],
            ['name' => 'purchase-payments.create', 'group' => 'payments'],
            ['name' => 'purchase-payments.edit', 'group' => 'payments'],
            ['name' => 'purchase-payments.delete', 'group' => 'payments'],

            // Sale Payments
            ['name' => 'sale-payments.index', 'group' => 'payments'],
            ['name' => 'sale-payments.show', 'group' => 'payments'],
            ['name' => 'sale-payments.create', 'group' => 'payments'],
            ['name' => 'sale-payments.edit', 'group' => 'payments'],
            ['name' => 'sale-payments.delete', 'group' => 'payments'],

            // Purchase Returns
            ['name' => 'purchase-returns.index', 'group' => 'returns'],
            ['name' => 'purchase-returns.show', 'group' => 'returns'],
            ['name' => 'purchase-returns.create', 'group' => 'returns'],
            ['name' => 'purchase-returns.edit', 'group' => 'returns'],
            ['name' => 'purchase-returns.delete', 'group' => 'returns'],

            // Sale Returns
            ['name' => 'sale-returns.index', 'group' => 'returns'],
            ['name' => 'sale-returns.show', 'group' => 'returns'],
            ['name' => 'sale-returns.create', 'group' => 'returns'],
            ['name' => 'sale-returns.edit', 'group' => 'returns'],
            ['name' => 'sale-returns.delete', 'group' => 'returns'],

            // Stock Adjustments
            ['name' => 'stock-adjustments.index', 'group' => 'inventory'],
            ['name' => 'stock-adjustments.show', 'group' => 'inventory'],
            ['name' => 'stock-adjustments.create', 'group' => 'inventory'],
            ['name' => 'stock-adjustments.edit', 'group' => 'inventory'], // Usually adjustment is create only but just in case

            // Cash In
            ['name' => 'cash-ins.index', 'group' => 'finance'],
            ['name' => 'cash-ins.show', 'group' => 'finance'],
            ['name' => 'cash-ins.create', 'group' => 'finance'],
            ['name' => 'cash-ins.edit', 'group' => 'finance'],
            ['name' => 'cash-ins.delete', 'group' => 'finance'],

            // Cash Out
            ['name' => 'cash-outs.index', 'group' => 'finance'],
            ['name' => 'cash-outs.show', 'group' => 'finance'],
            ['name' => 'cash-outs.create', 'group' => 'finance'],
            ['name' => 'cash-outs.edit', 'group' => 'finance'],
            ['name' => 'cash-outs.delete', 'group' => 'finance'],

            // Journal Entries
            ['name' => 'journal-entries.index', 'group' => 'finance'],
            ['name' => 'journal-entries.show', 'group' => 'finance'],
            ['name' => 'journal-entries.create', 'group' => 'finance'],
            ['name' => 'journal-entries.edit', 'group' => 'finance'],
            
            // Suppliers
            ['name' => 'suppliers.index', 'group' => 'master'],
            ['name' => 'suppliers.show', 'group' => 'master'],
            ['name' => 'suppliers.create', 'group' => 'master'],
            ['name' => 'suppliers.edit', 'group' => 'master'],
            ['name' => 'suppliers.delete', 'group' => 'master'],

            // Customers
            ['name' => 'customers.index', 'group' => 'master'],
            ['name' => 'customers.show', 'group' => 'master'],
            ['name' => 'customers.create', 'group' => 'master'],
            ['name' => 'customers.edit', 'group' => 'master'],
            ['name' => 'customers.delete', 'group' => 'master'],

            // Items
            ['name' => 'items.index', 'group' => 'master'],
            ['name' => 'items.show', 'group' => 'master'],
            ['name' => 'items.create', 'group' => 'master'],
            ['name' => 'items.edit', 'group' => 'master'],
            ['name' => 'items.delete', 'group' => 'master'],

            // Cities
            ['name' => 'cities.index', 'group' => 'master'],
            ['name' => 'cities.show', 'group' => 'master'],
            ['name' => 'cities.create', 'group' => 'master'],
            ['name' => 'cities.edit', 'group' => 'master'],
            ['name' => 'cities.delete', 'group' => 'master'],

            // Banks
            ['name' => 'banks.index', 'group' => 'master'],
            ['name' => 'banks.show', 'group' => 'master'],
            ['name' => 'banks.create', 'group' => 'master'],
            ['name' => 'banks.edit', 'group' => 'master'],

            // UOMs
            ['name' => 'uoms.index', 'group' => 'master'],
            ['name' => 'uoms.show', 'group' => 'master'],
            ['name' => 'uoms.create', 'group' => 'master'],
            ['name' => 'uoms.edit', 'group' => 'master'],

            // COA
            ['name' => 'chart-of-accounts.index', 'group' => 'master'],
            ['name' => 'chart-of-accounts.show', 'group' => 'master'],
            ['name' => 'chart-of-accounts.create', 'group' => 'master'],
            ['name' => 'chart-of-accounts.edit', 'group' => 'master'],

            // Reports & Finance Views
            ['name' => 'reports.view', 'group' => 'reports'],
            ['name' => 'finance.view', 'group' => 'finance'],


            // Users & Access Control
            ['name' => 'users.index', 'group' => 'users'],
            ['name' => 'users.show', 'group' => 'users'],
            ['name' => 'users.create', 'group' => 'users'],
            ['name' => 'users.edit', 'group' => 'users'],
            ['name' => 'users.delete', 'group' => 'users'],

            ['name' => 'roles.index', 'group' => 'users'],
            ['name' => 'roles.show', 'group' => 'users'],
            ['name' => 'roles.create', 'group' => 'users'],
            ['name' => 'roles.edit', 'group' => 'users'],
            ['name' => 'roles.delete', 'group' => 'users'],

            ['name' => 'permissions.index', 'group' => 'users'],
            ['name' => 'permissions.show', 'group' => 'users'],
            ['name' => 'permissions.create', 'group' => 'users'],
            ['name' => 'permissions.edit', 'group' => 'users'],
            ['name' => 'permissions.delete', 'group' => 'users'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                ['group' => $permission['group']], // Only set group if creating new
            );
        }

        // create roles and assign created permissions

        // SUPER ADMIN
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);
        // Super Admin gets all permissions
        $superAdminRole->givePermissionTo(Permission::all());

        // VIEWER
        $viewerRole = Role::firstOrCreate(['name' => 'Viewer']);
        $viewerPermissions = [
            'purchases.index', 'purchases.show', 'purchases.print',
            'sales.index', 'sales.show', 'sales.print',
            'purchase-payments.index', 'purchase-payments.show',
            'sale-payments.index', 'sale-payments.show',
            'purchase-returns.index', 'purchase-returns.show',
            'sale-returns.index', 'sale-returns.show',
            'stock-adjustments.index', 'stock-adjustments.show',
            'cash-ins.index', 'cash-ins.show',
            'cash-outs.index', 'cash-outs.show',
            'journal-entries.index', 'journal-entries.show',
            'suppliers.index', 'suppliers.show',
            'customers.index', 'customers.show',
            'items.index', 'items.show',
            'cities.index', 'cities.show',
            'banks.index', 'banks.show',
            'uoms.index', 'uoms.show',
            'chart-of-accounts.index', 'chart-of-accounts.show',
            'reports.view',
            'finance.view',
        ];
        $viewerRole->syncPermissions($viewerPermissions);

        // ADMIN
        $adminRole = Role::firstOrCreate(['name' => 'Admin']);
        $adminRole->syncPermissions([
            // Purchases
            'purchases.index', 'purchases.show', 'purchases.create', 'purchases.edit', 'purchases.print',
            // Sales
            'sales.index', 'sales.show', 'sales.create', 'sales.edit', 'sales.print',
            // Payments
            'purchase-payments.index', 'purchase-payments.show', 'purchase-payments.create', 'purchase-payments.edit',
            'sale-payments.index', 'sale-payments.show', 'sale-payments.create', 'sale-payments.edit',
            // Returns
            'purchase-returns.index', 'purchase-returns.show', 'purchase-returns.create', 'purchase-returns.edit',
            'sale-returns.index', 'sale-returns.show', 'sale-returns.create', 'sale-returns.edit',
            // Inventory
            'stock-adjustments.index', 'stock-adjustments.show', 'stock-adjustments.create',
            // Finance
            'cash-ins.index', 'cash-ins.show', 'cash-ins.create', 'cash-ins.edit',
            'cash-outs.index', 'cash-outs.show', 'cash-outs.create', 'cash-outs.edit',
            'journal-entries.index', 'journal-entries.show', 'journal-entries.create',
            'finance.view', 'reports.view',
            // Masters
            'suppliers.index', 'suppliers.show', 'suppliers.create', 'suppliers.edit',
            'customers.index', 'customers.show', 'customers.create', 'customers.edit',
            'items.index', 'items.show', 'items.create', 'items.edit',
            'cities.index', 'cities.show', 'cities.create',
            'banks.index', 'banks.show', 'banks.create', 'banks.edit',
            'uoms.index', 'uoms.show',
            'chart-of-accounts.index', 'chart-of-accounts.show',
        ]);

        // Assign Roles to Users
        
        // 1. Reset all users roles
        $users = User::all();
        foreach ($users as $user) {
            $user->syncRoles([]);
            $user->assignRole($superAdminRole);
        }
    }
}
