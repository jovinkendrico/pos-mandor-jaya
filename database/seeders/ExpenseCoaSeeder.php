<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class ExpenseCoaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Hapus semua akun dengan kode 6101-6199 dan 6201-6299
        ChartOfAccount::whereBetween('code', ['6101', '6199'])->forceDelete();
        ChartOfAccount::whereBetween('code', ['6201', '6299'])->forceDelete();

        // 2. Pastikan parent 6100 ada
        $operasionalParent = ChartOfAccount::firstOrCreate(
            ['code' => '6100'],
            [
                'name' => 'Biaya Operasional',
                'type' => 'expense',
                'parent_id' => null,
                'description' => 'Biaya Operasional',
                'is_active' => true,
            ]
        );
        // Jika sudah ada sebelumnya dengan nama lain, bisa kita update namanya agar sesuai
        $operasionalParent->update(['name' => 'Biaya Operasional', 'description' => 'Biaya Operasional']);

        // 3. Tambahkan anak-anak dari 6100
        $operasionalAccounts = [
            ['code' => '6101', 'name' => 'Biaya Uang Jalan TBS'],
            ['code' => '6102', 'name' => 'Biaya Uang Jalan Jangkos Dll'],
            ['code' => '6103', 'name' => 'Biaya Isi Solar'],
            ['code' => '6104', 'name' => 'Biaya Reperasi / Spareparts'],
            ['code' => '6105', 'name' => 'Biaya Pemakaian Ban'],
            ['code' => '6106', 'name' => 'Biaya Oli'],
            ['code' => '6107', 'name' => 'Biaya STNK + Speksi'],
            ['code' => '6108', 'name' => 'Biaya Gaji Supir + Operator + Helper Beko'],
        ];

        foreach ($operasionalAccounts as $account) {
            ChartOfAccount::firstOrCreate(
                ['code' => $account['code']],
                [
                    'name' => $account['name'],
                    'type' => 'expense',
                    'parent_id' => $operasionalParent->id,
                    'description' => $account['name'],
                    'is_active' => true,
                ]
            );
        }

        // 4. Pastikan parent 6200 ada
        $adminParent = ChartOfAccount::firstOrCreate(
            ['code' => '6200'],
            [
                'name' => 'Biaya Administrasi dan Umum',
                'type' => 'expense',
                'parent_id' => null,
                'description' => 'Biaya Administrasi dan Umum',
                'is_active' => true,
            ]
        );
        $adminParent->update(['name' => 'Biaya Administrasi dan Umum', 'description' => 'Biaya Administrasi dan Umum']);

        // 5. Tambahkan anak-anak dari 6200
        $adminAccounts = [
            ['code' => '6201', 'name' => 'Biaya BBM + Operasional'],
            ['code' => '6202', 'name' => 'Biaya token Listrik'],
            ['code' => '6203', 'name' => 'Biaya Komsumsi'],
            ['code' => '6204', 'name' => 'Biaya Perobatan'],
            ['code' => '6205', 'name' => 'Biaya Pupuk'],
            ['code' => '6206', 'name' => 'Biaya Racun'],
            ['code' => '6207', 'name' => 'biaya Padas'],
            ['code' => '6208', 'name' => 'Biaya Instansi'],
            ['code' => '6209', 'name' => 'Biaya Lain-lain'],
            ['code' => '6210', 'name' => 'Biaya Servis / STNK Kereta Kebun'],
            ['code' => '6211', 'name' => 'Biaya Perawatan Jalan'],
            ['code' => '6212', 'name' => 'Biaya Perbaikan MESS'],
            ['code' => '6213', 'name' => 'Biaya Inventaris Kebun'],
            ['code' => '6214', 'name' => 'Biaya Spareparts Kebun'],
            ['code' => '6215', 'name' => 'Biaya Gaji Mandor  & Humas'],
            ['code' => '6216', 'name' => 'Biaya Premi + Insentif'],
            ['code' => '6217', 'name' => 'Biaya Jaga Malam'],
            ['code' => '6218', 'name' => 'Biaya Gaji Panen'],
            ['code' => '6219', 'name' => 'Biaya Gaji Muat'],
            ['code' => '6220', 'name' => 'Biaya Gaji Perawatan'],
            ['code' => '6221', 'name' => 'Biaya Prunning'],
            ['code' => '6222', 'name' => 'Biaya Kutip Berondolan'],
        ];

        foreach ($adminAccounts as $account) {
            ChartOfAccount::firstOrCreate(
                ['code' => $account['code']],
                [
                    'name' => $account['name'],
                    'type' => 'expense',
                    'parent_id' => $adminParent->id,
                    'description' => $account['name'],
                    'is_active' => true,
                ]
            );
        }
    }
}
