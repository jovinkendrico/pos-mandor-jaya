<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class AdditionalCoaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. ASSETS
        // Get Asset Parent
        $kasParent = ChartOfAccount::where('code', '1100')->first();

        // 2. LIABILITIES
        $hutangLancar = ChartOfAccount::where('code', '2100')->first();
        if ($hutangLancar) {
            ChartOfAccount::firstOrCreate(['code' => '2104'], ['name' => 'Titipan Pelanggan', 'type' => 'liability', 'parent_id' => $hutangLancar->id, 'description' => 'Uang titipan pelanggan (Kemb. Titipan)', 'is_active' => true]);
        }
        
        // 3. INCOME
        $pendapatanParent = ChartOfAccount::where('code', '4100')->first();
        if ($pendapatanParent) {
            ChartOfAccount::firstOrCreate(['code' => '4104'], ['name' => 'Pendapatan Bunga', 'type' => 'income', 'parent_id' => $pendapatanParent->id, 'description' => 'Bunga simpanan dll', 'is_active' => true]);
            ChartOfAccount::firstOrCreate(['code' => '4105'], ['name' => 'Pendapatan Cashback', 'type' => 'income', 'parent_id' => $pendapatanParent->id, 'description' => 'Cashback transaksi', 'is_active' => true]);
        }

        // 4. EXPENSES
        $bebanOperasional = ChartOfAccount::where('code', '6100')->first();
        if ($bebanOperasional) {
            // Sembahyang (Religious)
            ChartOfAccount::firstOrCreate(['code' => '6120'], ['name' => 'Biaya Sembahyang', 'type' => 'expense', 'parent_id' => $bebanOperasional->id, 'description' => 'Kue, barang sembahyang, dupa', 'is_active' => true]);
            
            // Entertainment
            ChartOfAccount::firstOrCreate(['code' => '6121'], ['name' => 'Biaya Entertainment', 'type' => 'expense', 'parent_id' => $bebanOperasional->id, 'description' => 'Entertaint tamu/klien, uang minyak atm', 'is_active' => true]);
            
            // Vehicle Maintenance (Kendaraan)
            // Assuming 6107 is General Maintenance, we make these children or separate
            ChartOfAccount::firstOrCreate(['code' => '6122'], ['name' => 'Biaya Kendaraan', 'type' => 'expense', 'parent_id' => $bebanOperasional->id, 'description' => 'Ganti oli, servis kendaraan operasional', 'is_active' => true]);
            
            // Dues & Subscriptions (Iuran)
            ChartOfAccount::firstOrCreate(['code' => '6123'], ['name' => 'Biaya Iuran & Sumbangan', 'type' => 'expense', 'parent_id' => $bebanOperasional->id, 'description' => 'SPSI, Iuran Lingkungan, THR', 'is_active' => true]);
            
            // Gifts (Parcel/Ucapan)
            ChartOfAccount::firstOrCreate(['code' => '6124'], ['name' => 'Biaya Hadiah & Parcel', 'type' => 'expense', 'parent_id' => $bebanOperasional->id, 'description' => 'Kartu ucapan, parcel natal/lebaran', 'is_active' => true]);
            
            // Office Supplies (More specific than ATK if needed, but maybe map to ATK)
            // 6105 ATK already exists. We can add sub-types if user wants, or just map "Kertas printer" to ATK.
            // But user asked for specific COAs for these. 
            ChartOfAccount::firstOrCreate(['code' => '6125'], ['name' => 'Perlengkapan Kantor', 'type' => 'expense', 'parent_id' => $bebanOperasional->id, 'description' => 'Obat-obatan, perlengkapan kebersihan, dll', 'is_active' => true]);

            // Salaries specific
            // 6101 Gaji already exists.
            ChartOfAccount::firstOrCreate(['code' => '6126'], ['name' => 'Uang Jalan', 'type' => 'expense', 'parent_id' => $bebanOperasional->id, 'description' => 'Uang jalan supir/kernet', 'is_active' => true]);
        }
    }
}
