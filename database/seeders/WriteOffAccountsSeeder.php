<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WriteOffAccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accounts = [
            [
                'code' => '6999',
                'name' => 'Selisih Pembulatan - Pembelian',
                'type' => 'expense',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => '4999',
                'name' => 'Selisih Pembulatan - Penjualan',
                'type' => 'income',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($accounts as $account) {
            // Check if account already exists
            $exists = DB::table('chart_of_accounts')
                ->where('code', $account['code'])
                ->exists();

            if (!$exists) {
                DB::table('chart_of_accounts')->insert($account);
            }
        }
    }
}
