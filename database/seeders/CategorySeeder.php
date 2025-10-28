<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Income Categories
        $salesRevenue = Category::create([
            'name' => 'Sales Revenue',
            'type' => 'income',
            'description' => 'Revenue from sales transactions',
            'is_active' => true,
        ]);

        Category::create([
            'name' => 'Other Income',
            'type' => 'income',
            'description' => 'Other sources of income',
            'is_active' => true,
        ]);

        Category::create([
            'name' => 'Investment',
            'type' => 'income',
            'description' => 'Investment income',
            'is_active' => true,
        ]);

        Category::create([
            'name' => 'Loan Received',
            'type' => 'income',
            'description' => 'Loans received',
            'is_active' => true,
        ]);

        // Expense Categories
        $cogs = Category::create([
            'name' => 'Cost of Goods Sold',
            'type' => 'expense',
            'description' => 'Cost of goods sold (COGS)',
            'is_active' => true,
        ]);

        $operatingExpenses = Category::create([
            'name' => 'Operating Expenses',
            'type' => 'expense',
            'description' => 'General operating expenses',
            'is_active' => true,
        ]);

        // Sub-categories for Operating Expenses
        Category::create([
            'name' => 'Transport',
            'type' => 'expense',
            'parent_id' => $operatingExpenses->id,
            'description' => 'Transportation costs (fuel, vehicle maintenance, etc.)',
            'is_active' => true,
        ]);

        Category::create([
            'name' => 'Marketing',
            'type' => 'expense',
            'parent_id' => $operatingExpenses->id,
            'description' => 'Marketing and advertising expenses',
            'is_active' => true,
        ]);

        Category::create([
            'name' => 'Office Supplies',
            'type' => 'expense',
            'parent_id' => $operatingExpenses->id,
            'description' => 'Office supplies and equipment',
            'is_active' => true,
        ]);

        Category::create([
            'name' => 'Utilities',
            'type' => 'expense',
            'parent_id' => $operatingExpenses->id,
            'description' => 'Utilities (electricity, water, internet, phone)',
            'is_active' => true,
        ]);

        Category::create([
            'name' => 'Salaries',
            'type' => 'expense',
            'parent_id' => $operatingExpenses->id,
            'description' => 'Employee salaries and wages',
            'is_active' => true,
        ]);

        Category::create([
            'name' => 'Rent',
            'type' => 'expense',
            'parent_id' => $operatingExpenses->id,
            'description' => 'Rent and lease payments',
            'is_active' => true,
        ]);

        Category::create([
            'name' => 'Insurance',
            'type' => 'expense',
            'parent_id' => $operatingExpenses->id,
            'description' => 'Insurance premiums',
            'is_active' => true,
        ]);

        Category::create([
            'name' => 'Other Expenses',
            'type' => 'expense',
            'description' => 'Other miscellaneous expenses',
            'is_active' => true,
        ]);
    }
}
