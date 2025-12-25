import FilterBar from '@/components/transaction/filter-bar';
import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatNumberWithSeparator } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { AlertCircle, AlertTriangle, Printer } from 'lucide-react';
import { useRef } from 'react';

interface PageProps {
    dateFrom: string;
    dateTo: string;
    minDays: number;
    summary: {
        total_items: number;
        total_stock_value: number;
        avg_days_without_sale: number;
    };
    deadStockItems: Array<{
        item_id: number;
        item_code: string;
        item_name: string;
        stock: number;
        unit: string;
        avg_cost: number;
        stock_value: number;
        last_sale_date: string | null;
        days_without_sale: number;
    }>;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports' },
    { title: 'Laporan Barang Paling Tidak Laku', href: '#' },
];

export default function DeadStockReportIndex({
    dateFrom,
    dateTo,
    minDays,
    summary,
    deadStockItems,
}: PageProps) {
    const deadStockRoute = () => ({ url: '/reports/dead-stock' });

    const defaultParams = useRef({
        search: '',
        status: 'all',
        date_from: dateFrom,
        date_to: dateTo,
        min_days: minDays.toString(),
        sort_by: 'created_at',
        sort_order: 'desc',
    }).current;

    const { allFilters, handleFilterChange } = useResourceFilters(
        deadStockRoute,
        defaultParams,
    );

    const getDaysBadge = (days: number) => {
        if (days >= 365)
            return <Badge variant="destructive">{days} hari</Badge>;
        if (days >= 180)
            return <Badge className="bg-orange-600 text-white">{days} hari</Badge>;
        return <Badge variant="outline">{days} hari</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Barang Paling Tidak Laku" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Barang Paling Tidak Laku (Dead Stock)" />
            </div>

            <FilterBar
                filters={allFilters}
                onFilterChange={handleFilterChange}
                showDateRange={true}
                showSearch={false}
                showStatus={false}
                showPaymentStatus={false}
                showSort={false}
                defaultFilters={defaultParams}
            >
                <div className="w-[180px]">
                    <Label htmlFor="min_days">Min. Hari Tanpa Penjualan</Label>
                    <Input
                        id="min_days"
                        type="text"
                        value={formatNumberWithSeparator(
                            parseInt(allFilters.min_days ?? '0'),
                        )}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            handleFilterChange({ min_days: value });
                        }}
                        className="input-box text-center"
                    />
                </div>
            </FilterBar>

            <div className="flex w-full justify-end">
                <Button
                    onClick={() => {
                        const params = new URLSearchParams({
                            date_from: allFilters.date_from,
                            date_to: allFilters.date_to,
                            min_days: (allFilters.min_days ?? '30').toString(),
                        });
                        window.open(
                            `/reports/dead-stock/print?${params.toString()}`,
                            '_blank',
                        );
                    }}
                    variant="outline"
                    className="btn-primary"
                >
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak PDF
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="mb-4 grid gap-4 md:grid-cols-3">
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-danger-500" />
                            Total Item Dead Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-danger-500">
                            {summary.total_items}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Item tidak laku
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Nilai Persediaan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-danger-500">
                            {formatCurrency(summary.total_stock_value)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Nilai menganggur
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Rata-rata Hari
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round(summary.avg_days_without_sale)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Hari tanpa penjualan
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Dead Stock Items Table */}
            <Card className="content">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-danger-500" />
                        Daftar Barang Dead Stock
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} -{' '}
                        {format(new Date(dateTo), 'dd MMM yyyy')}
                        {' | '}Minimum:{' '}
                        {formatNumberWithSeparator(
                            parseInt(allFilters.min_days ?? '0'),
                        )}{' '}
                        hari tanpa penjualan
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="input-box overflow-x-auto rounded-lg">
                        <Table className="content">
                            <TableHeader>
                                <TableRow className="dark:border-b-2 dark:border-white/25">
                                    <TableHead className="text-center">
                                        Kode
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Nama Barang
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Stok
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Unit
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Harga Rata-rata
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Nilai Persediaan
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Tanggal Penjualan Terakhir
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Hari Tanpa Penjualan
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deadStockItems.length > 0 ? (
                                    deadStockItems.map((item) => (
                                        <TableRow
                                            key={item.item_id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-mono">
                                                {item.item_code}
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {item.item_name}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.stock.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.unit}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.avg_cost)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-red-600 dark:text-danger-500">
                                                {formatCurrency(
                                                    item.stock_value,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.last_sale_date
                                                    ? format(
                                                          new Date(
                                                              item.last_sale_date,
                                                          ),
                                                          'dd MMM yyyy',
                                                      )
                                                    : 'Belum pernah terjual'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getDaysBadge(
                                                    item.days_without_sale,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableCell
                                            colSpan={8}
                                            className="text-center text-muted-foreground"
                                        >
                                            Tidak ada item dead stock
                                        </TableCell>
                                    </TableRow>
                                )}
                                {deadStockItems.length > 0 && (
                                    <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25">
                                        <TableCell
                                            colSpan={5}
                                            className="text-center"
                                        >
                                            Total
                                        </TableCell>
                                        <TableCell className="text-right text-red-600 dark:text-danger-500">
                                            {formatCurrency(
                                                summary.total_stock_value,
                                            )}
                                        </TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

