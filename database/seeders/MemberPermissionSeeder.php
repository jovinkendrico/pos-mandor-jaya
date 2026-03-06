<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class MemberPermissionSeeder extends Seeder
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
            // Members
            ['name' => 'members.index', 'group' => 'master'],
            ['name' => 'members.show', 'group' => 'master'],
            ['name' => 'members.create', 'group' => 'master'],
            ['name' => 'members.edit', 'group' => 'master'],
            ['name' => 'members.delete', 'group' => 'master'],

            // Member Loans
            ['name' => 'member-loans.index', 'group' => 'finance'],
            ['name' => 'member-loans.show', 'group' => 'finance'],
            ['name' => 'member-loans.create', 'group' => 'finance'],
            ['name' => 'member-loans.edit', 'group' => 'finance'],
            ['name' => 'member-loans.delete', 'group' => 'finance'],

            // Member Loan Payments
            ['name' => 'member-loan-payments.index', 'group' => 'finance'],
            ['name' => 'member-loan-payments.show', 'group' => 'finance'],
            ['name' => 'member-loan-payments.create', 'group' => 'finance'],
            ['name' => 'member-loan-payments.edit', 'group' => 'finance'],
            ['name' => 'member-loan-payments.delete', 'group' => 'finance'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                ['group' => $permission['group']]
            );
        }

        // SUPER ADMIN gets all permissions automatically (via Gate or mapping)
        // But explicitly give it here just in case
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);
        $superAdminRole->givePermissionTo(Permission::all());

        // ADMIN
        $adminRole = Role::firstOrCreate(['name' => 'Admin']);
        $adminPermissions = [
            'members.index', 'members.show', 'members.create', 'members.edit',
            'member-loans.index', 'member-loans.show', 'member-loans.create', 'member-loans.edit',
            'member-loan-payments.index', 'member-loan-payments.show', 'member-loan-payments.create', 'member-loan-payments.edit',
        ];
        $adminRole->givePermissionTo($adminPermissions);

        // VIEWER
        $viewerRole = Role::firstOrCreate(['name' => 'Viewer']);
        $viewerPermissions = [
            'members.index', 'members.show',
            'member-loans.index', 'member-loans.show',
            'member-loan-payments.index', 'member-loan-payments.show',
        ];
        $viewerRole->givePermissionTo($viewerPermissions);
        
        $this->command->info('Member and Loan permissions seeded successfully.');
    }
}
