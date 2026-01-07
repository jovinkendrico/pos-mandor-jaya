import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import useResourceFilters from '@/hooks/use-resource-filters';
import { Head, Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDatetoString, formatNumber } from '@/lib/utils';
import Pagination from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface SaleDetail {
    id: number;
    item: { name: string };
    itemUom: { uom: { name: string } };
    quantity: number;
    cost: number;
    price: number;
    subtotal: number;
}

interface Sale {
    id: number;
    sale_number: string;
    sale_date: string;
    customer: { name: string };
    creator: { name: string };
    details: SaleDetail[];
    total_amount: number;
}

interface PageProps {
    filters: {
        date_from: string;
        date_to: string;
    };
    sales: {
        data: Sale[];
        links: any[];
        meta: {
            from: number;
            to: number;
            total: number;
            last_page: number;
            current_page: number;
        };
    };
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Binder', href: '#' },
];

export default function BinderReportIndex({ filters, sales }: PageProps) {
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
                    <CardTitle>Preview Laporan ({sales.meta.total} Transaksi)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {sales.data.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Tidak ada data penjualan pada periode ini.</div>
                    ) : (
                        sales.data.map((sale) => (
                            <div key={sale.id} className="border rounded-md overflow-hidden">
                                <div className="bg-muted px-4 py-2 text-sm font-semibold flex flex-wrap gap-4 border-b">
                                    <span>{sale.sale_number}</span>
                                    <span className="text-muted-foreground">|</span>
                                    <span>{formatDatetoString(new Date(sale.sale_date))}</span>
                                    <span className="text-muted-foreground">|</span>
                                    <span>Customer: {sale.customer?.name || 'UMUM'}</span>
                                    <span className="text-muted-foreground">|</span>
                                    <span>Created: {sale.creator?.name || '-'}</span>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-white dark:bg-zinc-900 border-b">
                                            <TableHead className="w-[35%] h-8">Nama Barang</TableHead>
                                            <TableHead className="text-center w-[10%] h-8">Stok Dijual</TableHead>
                                            <TableHead className="text-right w-[12%] h-8">Harga Beli</TableHead>
                                            <TableHead className="text-right w-[15%] h-8">Total Beli</TableHead>
                                            <TableHead className="text-right w-[12%] h-8">Harga Jual</TableHead>
                                            <TableHead className="text-right w-[15%] h-8">Total Jual</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sale.details.map((detail) => {
                                            const unitCost = detail.quantity ? detail.cost / detail.quantity : 0;
                                            return (
                                                <TableRow key={detail.id} className="hover:bg-transparent">
                                                    <TableCell className="py-2">{detail.item?.name || '-'}</TableCell>
                                                    <TableCell className="text-center py-2">
                                                        {formatNumber(detail.quantity)} {detail.itemUom?.uom?.name}
                                                    </TableCell>
                                                    <TableCell className="text-right text-red-600 dark:text-red-400 font-mono text-xs py-2">
                                                        {formatCurrency(unitCost)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-red-600 dark:text-red-400 font-mono text-xs py-2">
                                                        {formatCurrency(detail.cost)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs py-2">
                                                        {formatCurrency(detail.price)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs py-2">
                                                        {formatCurrency(detail.subtotal)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {/* Summary Row */}
                                        <TableRow className="bg-muted/50 font-bold border-t">
                                            <TableCell colSpan={3} className="text-right py-2">TOTAL:</TableCell>
                                            <TableCell className="text-right text-red-600 dark:text-red-400 py-2">
                                                {formatCurrency(sale.details.reduce((acc, curr) => acc + curr.cost, 0))}
                                            </TableCell>
                                            <TableCell className="py-2"></TableCell>
                                            <TableCell className="text-right py-2">
                                                {formatCurrency(sale.details.reduce((acc, curr) => acc + curr.subtotal, 0))}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        ))
                    )}
                </CardContent>
                {sales.meta.last_page > 1 && (
                    <div className="p-4 border-t">
                        <Pagination links={sales.links} />
                    </div>
                )}
            </Card>
        </AppLayout>
    );
}
