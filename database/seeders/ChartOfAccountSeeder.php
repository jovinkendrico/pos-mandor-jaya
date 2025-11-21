<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class ChartOfAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ASET (1xxx)
        $kasParent = ChartOfAccount::firstOrCreate(
            ['code' => '1100'],
            [
                'name' => 'Kas',
                'type' => 'asset',
                'parent_id' => null,
                'description' => 'Kas & Setara Kas',
                'is_active' => true,
            ]
        );

        ChartOfAccount::firstOrCreate(['code' => '1101'], ['name' => 'Kas Kecil', 'type' => 'asset', 'parent_id' => $kasParent->id, 'description' => 'Kas kecil untuk operasional harian', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '1102'], ['name' => 'Kas Besar', 'type' => 'asset', 'parent_id' => $kasParent->id, 'description' => 'Kas besar untuk transaksi besar', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '1103'], ['name' => 'Bank BCA', 'type' => 'asset', 'parent_id' => $kasParent->id, 'description' => 'Rekening Bank BCA', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '1104'], ['name' => 'Bank Mandiri', 'type' => 'asset', 'parent_id' => $kasParent->id, 'description' => 'Rekening Bank Mandiri', 'is_active' => true]);

        $piutangParent = ChartOfAccount::firstOrCreate(
            ['code' => '1200'],
            [
                'name' => 'Piutang',
                'type' => 'asset',
                'parent_id' => null,
                'description' => 'Piutang Usaha',
                'is_active' => true,
            ]
        );

        ChartOfAccount::firstOrCreate(['code' => '1201'], ['name' => 'Piutang Usaha', 'type' => 'asset', 'parent_id' => $piutangParent->id, 'description' => 'Piutang dari penjualan', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '1202'], ['name' => 'Piutang Karyawan', 'type' => 'asset', 'parent_id' => $piutangParent->id, 'description' => 'Piutang kepada karyawan', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '1203'], ['name' => 'Cadangan Kerugian Piutang', 'type' => 'asset', 'parent_id' => $piutangParent->id, 'description' => 'Cadangan untuk piutang yang tidak tertagih', 'is_active' => true]);

        $persediaanParent = ChartOfAccount::firstOrCreate(
            ['code' => '1300'],
            [
                'name' => 'Persediaan Barang Dagang',
                'type' => 'asset',
                'parent_id' => null,
                'description' => 'Persediaan barang untuk dijual',
                'is_active' => true,
            ]
        );

        // Hanya satu akun persediaan: Persediaan Barang (tidak dipisah per kategori)
        ChartOfAccount::updateOrCreate(
            ['code' => '1301'],
            [
                'name' => 'Persediaan Barang',
                'type' => 'asset',
                'parent_id' => $persediaanParent->id,
                'description' => 'Persediaan barang dagang',
                'is_active' => true,
            ]
        );

        // Nonaktifkan akun persediaan lama jika ada
        $oldInventoryCodes = ['1302', '1303', '1304', '1305', '1309'];
        foreach ($oldInventoryCodes as $code) {
            $oldAccount = ChartOfAccount::where('code', $code)->first();
            if ($oldAccount) {
                $oldAccount->update(['is_active' => false]);
            }
        }

        $uangMukaParent = ChartOfAccount::firstOrCreate(
            ['code' => '1400'],
            [
                'name' => 'Uang Muka',
                'type' => 'asset',
                'parent_id' => null,
                'description' => 'Uang Muka & Aset Lain',
                'is_active' => true,
            ]
        );

        ChartOfAccount::firstOrCreate(['code' => '1401'], ['name' => 'Uang Muka Pembelian', 'type' => 'asset', 'parent_id' => $uangMukaParent->id, 'description' => 'Uang muka untuk pembelian', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '1402'], ['name' => 'Pajak dibayar dimuka', 'type' => 'asset', 'parent_id' => $uangMukaParent->id, 'description' => 'Pajak yang sudah dibayar di muka', 'is_active' => true]);

        $asetTetapParent = ChartOfAccount::firstOrCreate(
            ['code' => '1500'],
            [
                'name' => 'Aset Tetap',
                'type' => 'asset',
                'parent_id' => null,
                'description' => 'Aset Tetap',
                'is_active' => true,
            ]
        );

        ChartOfAccount::firstOrCreate(['code' => '1501'], ['name' => 'Kendaraan', 'type' => 'asset', 'parent_id' => $asetTetapParent->id, 'description' => 'Kendaraan operasional', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '1502'], ['name' => 'Peralatan Toko', 'type' => 'asset', 'parent_id' => $asetTetapParent->id, 'description' => 'Peralatan yang digunakan di toko', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '1503'], ['name' => 'Rak & Etalase', 'type' => 'asset', 'parent_id' => $asetTetapParent->id, 'description' => 'Rak dan etalase toko', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '1504'], ['name' => 'Peralatan Berat', 'type' => 'asset', 'parent_id' => $asetTetapParent->id, 'description' => 'Peralatan berat seperti forklift', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '1509'], ['name' => 'Akumulasi Penyusutan', 'type' => 'asset', 'parent_id' => $asetTetapParent->id, 'description' => 'Akumulasi penyusutan aset tetap', 'is_active' => true]);

        // KEWAJIBAN (2xxx)
        $hutangLancarParent = ChartOfAccount::firstOrCreate(
            ['code' => '2100'],
            [
                'name' => 'Hutang Lancar',
                'type' => 'liability',
                'parent_id' => null,
                'description' => 'Hutang Lancar',
                'is_active' => true,
            ]
        );

        ChartOfAccount::firstOrCreate(['code' => '2101'], ['name' => 'Hutang Usaha', 'type' => 'liability', 'parent_id' => $hutangLancarParent->id, 'description' => 'Hutang kepada supplier', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '2102'], ['name' => 'Hutang Pajak', 'type' => 'liability', 'parent_id' => $hutangLancarParent->id, 'description' => 'Hutang pajak', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '2103'], ['name' => 'Hutang Gaji', 'type' => 'liability', 'parent_id' => $hutangLancarParent->id, 'description' => 'Hutang gaji karyawan', 'is_active' => true]);

        $hutangJangkaPanjangParent = ChartOfAccount::firstOrCreate(
            ['code' => '2200'],
            [
                'name' => 'Hutang Jangka Panjang',
                'type' => 'liability',
                'parent_id' => null,
                'description' => 'Hutang Jangka Panjang',
                'is_active' => true,
            ]
        );

        ChartOfAccount::firstOrCreate(['code' => '2201'], ['name' => 'Hutang Bank', 'type' => 'liability', 'parent_id' => $hutangJangkaPanjangParent->id, 'description' => 'Hutang bank jangka panjang', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '2202'], ['name' => 'Leasing', 'type' => 'liability', 'parent_id' => $hutangJangkaPanjangParent->id, 'description' => 'Hutang leasing', 'is_active' => true]);

        // MODAL (3xxx)
        $modalParent = ChartOfAccount::firstOrCreate(
            ['code' => '3100'],
            [
                'name' => 'Modal',
                'type' => 'equity',
                'parent_id' => null,
                'description' => 'Modal',
                'is_active' => true,
            ]
        );

        ChartOfAccount::firstOrCreate(['code' => '3101'], ['name' => 'Modal Pemilik', 'type' => 'equity', 'parent_id' => $modalParent->id, 'description' => 'Modal yang disetor pemilik', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '3102'], ['name' => 'Prive', 'type' => 'equity', 'parent_id' => $modalParent->id, 'description' => 'Pengambilan pribadi pemilik', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '3103'], ['name' => 'Laba Ditahan', 'type' => 'equity', 'parent_id' => $modalParent->id, 'description' => 'Laba yang tidak dibagikan', 'is_active' => true]);

        // PENDAPATAN (4xxx)
        $pendapatanParent = ChartOfAccount::firstOrCreate(
            ['code' => '4100'],
            [
                'name' => 'Pendapatan',
                'type' => 'income',
                'parent_id' => null,
                'description' => 'Pendapatan',
                'is_active' => true,
            ]
        );

        ChartOfAccount::firstOrCreate(['code' => '4101'], ['name' => 'Penjualan Barang Dagangan', 'type' => 'income', 'parent_id' => $pendapatanParent->id, 'description' => 'Pendapatan dari penjualan barang', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '4102'], ['name' => 'Pendapatan Jasa Pengiriman', 'type' => 'income', 'parent_id' => $pendapatanParent->id, 'description' => 'Pendapatan dari jasa pengiriman', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '4103'], ['name' => 'Pendapatan Lain-Lain', 'type' => 'income', 'parent_id' => $pendapatanParent->id, 'description' => 'Pendapatan lain-lain', 'is_active' => true]);

        // HPP (5xxx)
        $hppParent = ChartOfAccount::firstOrCreate(
            ['code' => '5100'],
            [
                'name' => 'HPP',
                'type' => 'expense',
                'parent_id' => null,
                'description' => 'Harga Pokok Penjualan',
                'is_active' => true,
            ]
        );

        ChartOfAccount::updateOrCreate(['code' => '5101'], ['name' => 'HPP', 'type' => 'expense', 'parent_id' => $hppParent->id, 'description' => 'Harga Pokok Penjualan', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '5102'], ['name' => 'Retur Pembelian', 'type' => 'expense', 'parent_id' => $hppParent->id, 'description' => 'Retur pembelian (mengurangi HPP)', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '5103'], ['name' => 'Biaya Angkut Pembelian', 'type' => 'expense', 'parent_id' => $hppParent->id, 'description' => 'Biaya angkut untuk pembelian', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '5104'], ['name' => 'Penyesuaian Stok', 'type' => 'expense', 'parent_id' => $hppParent->id, 'description' => 'Penyesuaian nilai stok', 'is_active' => true]);

        // BEBAN OPERASIONAL (6xxx)
        $bebanOperasionalParent = ChartOfAccount::firstOrCreate(
            ['code' => '6100'],
            [
                'name' => 'Beban Operasional',
                'type' => 'expense',
                'parent_id' => null,
                'description' => 'Beban Operasional',
                'is_active' => true,
            ]
        );

        ChartOfAccount::firstOrCreate(['code' => '6101'], ['name' => 'Gaji & Upah', 'type' => 'expense', 'parent_id' => $bebanOperasionalParent->id, 'description' => 'Biaya gaji dan upah karyawan', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '6102'], ['name' => 'Listrik', 'type' => 'expense', 'parent_id' => $bebanOperasionalParent->id, 'description' => 'Biaya listrik', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '6103'], ['name' => 'Internet', 'type' => 'expense', 'parent_id' => $bebanOperasionalParent->id, 'description' => 'Biaya internet', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '6104'], ['name' => 'Sewa Toko', 'type' => 'expense', 'parent_id' => $bebanOperasionalParent->id, 'description' => 'Biaya sewa tempat toko', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '6105'], ['name' => 'ATK', 'type' => 'expense', 'parent_id' => $bebanOperasionalParent->id, 'description' => 'Biaya alat tulis kantor', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '6106'], ['name' => 'Transportasi', 'type' => 'expense', 'parent_id' => $bebanOperasionalParent->id, 'description' => 'Biaya transportasi', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '6107'], ['name' => 'Pemeliharaan & Perbaikan', 'type' => 'expense', 'parent_id' => $bebanOperasionalParent->id, 'description' => 'Biaya pemeliharaan dan perbaikan', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '6108'], ['name' => 'Penyusutan', 'type' => 'expense', 'parent_id' => $bebanOperasionalParent->id, 'description' => 'Biaya penyusutan aset', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '6109'], ['name' => 'Administrasi Bank', 'type' => 'expense', 'parent_id' => $bebanOperasionalParent->id, 'description' => 'Biaya administrasi bank', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '6110'], ['name' => 'Beban Promosi', 'type' => 'expense', 'parent_id' => $bebanOperasionalParent->id, 'description' => 'Biaya promosi dan iklan', 'is_active' => true]);

        // BEBAN NON OPERASIONAL (7xxx)
        $bebanNonOperasionalParent = ChartOfAccount::firstOrCreate(
            ['code' => '7100'],
            [
                'name' => 'Beban Non Operasional',
                'type' => 'expense',
                'parent_id' => null,
                'description' => 'Beban Non Operasional',
                'is_active' => true,
            ]
        );

        ChartOfAccount::firstOrCreate(['code' => '7101'], ['name' => 'Beban Bunga', 'type' => 'expense', 'parent_id' => $bebanNonOperasionalParent->id, 'description' => 'Beban bunga bank', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '7102'], ['name' => 'Rugi Selisih Kurs', 'type' => 'expense', 'parent_id' => $bebanNonOperasionalParent->id, 'description' => 'Rugi selisih kurs', 'is_active' => true]);
        ChartOfAccount::firstOrCreate(['code' => '7103'], ['name' => 'Beban Lain-Lain', 'type' => 'expense', 'parent_id' => $bebanNonOperasionalParent->id, 'description' => 'Beban non operasional lain-lain', 'is_active' => true]);
    }
}
