import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatCurrency } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { Clock, Printer, Snail, Zap } from 'lucide-react';
import { useRef } from 'react';

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_items: number;
        fast_moving_count: number;
        medium_moving_count: number;
        slow_moving_count: number;
        avg_turnover_ratio: number;
        total_stock_value: number;
    };
    turnoverData: Array<{
        item_id: number;
        item_code: string;
        item_name: string;
        stock: number;
        unit: string;
        total_sales: number;
        avg_stock: number;
        avg_cost: number;
        stock_value: number;
        turnover_ratio: number;
        days_to_turnover: number;
        turnover_category: string;
    }>;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports' },
    { title: 'Laporan Perputaran Stok', href: '#' },
];

export default function StockTurnoverReportIndex({
    dateFrom,
    dateTo,
    summary,
    turnoverData,
}: PageProps) {
    const stockTurnoverRoute = () => ({ url: '/reports/stock-turnover' });

    const defaultParams = useRef({
        search: '',
        status: 'all',
        date_from: dateFrom,
        date_to: dateTo,
        sort_by: 'turnover_ratio',
        sort_order: 'desc',
    }).current;

    const { allFilters, handleFilterChange } = useResourceFilters(
        stockTurnoverRoute,
        defaultParams,
    );

    const getCategoryBadge = (category: string) => {
        if (category === 'fast') {
            return (
                <Badge className="badge-green-light">
                    <Zap className="mr-1 h-3 w-3" />
                    Cepat
                </Badge>
            );
        }
        if (category === 'medium') {
            return (
                <Badge className="badge-yellow-light">
                    <Clock className="mr-1 h-3 w-3" />
                    Sedang
                </Badge>
            );
        }
        return (
            <Badge className="badge-red-light">
                <Snail className="mr-1 h-3 w-3" />
                Lambat
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Perputaran Stok" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Perputaran Stok (Stock Turnover)" />
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
            />

            <div className="mb-4 flex w-full justify-end">
                <Button
                    onClick={() => {
                        const params = new URLSearchParams({
                            date_from: allFilters.date_from,
                            date_to: allFilters.date_to,
                        });
                        window.open(
                            `/reports/stock-turnover/print?${params.toString()}`,
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
            <div className="mb-4 grid gap-4 md:grid-cols-5">
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Item
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_items}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Item dianalisis
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-emerald-500">
                            <Zap className="h-4 w-4" />
                            Cepat
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-emerald-500">
                            {summary.fast_moving_count}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            ≥ 12x per tahun
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-500">
                            <Clock className="h-4 w-4" />
                            Sedang
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                            {summary.medium_moving_count}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            6-12x per tahun
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-danger-500">
                            <Snail className="h-4 w-4" />
                            Lambat
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-danger-500">
                            {summary.slow_moving_count}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {'<'} 6x per tahun
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Rata-rata Ratio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.avg_turnover_ratio.toFixed(2)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Perputaran stok
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Turnover Table */}
            <Card className="content">
                <CardHeader>
                    <CardTitle>Analisis Perputaran Stok</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} -{' '}
                        {format(new Date(dateTo), 'dd MMM yyyy')}
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
                                    <TableHead className="text-center">
                                        Stok
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Unit
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Total Penjualan
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Nilai Persediaan
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Turnover Ratio
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Hari untuk Turnover
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Kategori
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {turnoverData.length > 0 ? (
                                    turnoverData.map((item) => (
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
                                            <TableCell className="text-center">
                                                {item.stock.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.unit}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.total_sales.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    item.stock_value,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {item.turnover_ratio.toFixed(2)}
                                                x
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.days_to_turnover.toFixed(
                                                    0,
                                                )}{' '}
                                                hari
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getCategoryBadge(
                                                    item.turnover_category,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableCell
                                            colSpan={9}
                                            className="text-center text-muted-foreground"
                                        >
                                            Tidak ada data
                                        </TableCell>
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
