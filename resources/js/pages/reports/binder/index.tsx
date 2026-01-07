import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import useResourceFilters from '@/hooks/use-resource-filters';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
    filters: {
        date_from: string;
        date_to: string;
    };
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Binder', href: '#' },
];

export default function BinderReportIndex({ filters }: PageProps) {
    const binderRoute = () => ({ url: '/reports/binder' });

    const { allFilters, handleFilterChange } = useResourceFilters(
        binderRoute,
        {
            date_from: filters.date_from || '',
            date_to: filters.date_to || '',
            search: '',
            status: 'all',
            sort_by: '',
            sort_order: '',
        },
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Binder" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Binder (10 MJ/Halaman)" />
            </div>

            <FilterBar
                filters={allFilters}
                onFilterChange={handleFilterChange}
                showDateRange={true}
                showSearch={false}
                showStatus={false}
                showPaymentStatus={false}
                showSort={false}
            />

            <div className="flex w-full justify-end mt-4">
                <Button
                    onClick={() => {
                        const params = new URLSearchParams();
                        if (allFilters.date_from) params.append('date_from', allFilters.date_from as string);
                        if (allFilters.date_to) params.append('date_to', allFilters.date_to as string);

                        window.open(
                            `/reports/binder/print?${params.toString()}`,
                            '_blank',
                        );
                    }}
                    className="btn-primary"
                >
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Laporan (PDF)
                </Button>
            </div>

            <Card className="content mt-6">
                <CardHeader>
                    <CardTitle>Informasi Laporan</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Laporan ini akan mencetak detail penjualan (10 Nomor Invoice per Halaman) untuk keperluan arsip binder.
                        <br />
                        Kolom yang ditampilkan:
                        <ul className="list-disc list-inside mt-2">
                            <li>Nama Barang</li>
                            <li>Stok Dijual (Qty)</li>
                            <li>Harga Beli (Cost)</li>
                            <li>Total Harga Beli (Total Cost)</li>
                            <li>Harga Jual (Price)</li>
                            <li>Total Harga Jual (Subtotal)</li>
                        </ul>
                    </p>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
