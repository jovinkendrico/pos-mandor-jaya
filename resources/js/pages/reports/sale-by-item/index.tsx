import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
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
import { useState } from 'react';
import { Search, Printer } from 'lucide-react';

interface ItemSale {
    item_id: number;
    item_code: string;
    item_name: string;
    total_quantity: number;
    transaction_count: number;
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    avg_price: number;
    avg_cost: number;
    profit_margin: number;
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_items: number;
        total_quantity: number;
        total_transactions: number;
        total_revenue: number;
        total_cost: number;
        total_profit: number;
        profit_margin: number;
    };
    itemSales: ItemSale[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Penjualan per Item', href: '#' },
];

export default function SaleByItemIndex({
    dateFrom,
    dateTo,
    summary,
    itemSales,
}: PageProps) {
    const saleByItemRoute = () => ({ url: '/reports/sale-by-item' });

    const { allFilters, handleFilterChange } = useResourceFilters(
        saleByItemRoute,
        {
            search: '',
            status: 'all',
            date_from: dateFrom,
            date_to: dateTo,
            sort_by: 'date',
            sort_order: 'desc',
        },
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Penjualan per Item" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Penjualan per Item" />
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
                                    <Button
                                onClick={() => {
                                    const params = new URLSearchParams({
                                        date_from: filters.date_from,
                                        date_to: filters.date_to,
                                    });
                                    window.open(`/reports/sale-by-item/print?${params.toString()}`, '_blank');
                                }}
                                variant="outline"
                                className="flex-1"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Cetak PDF
                            </Button>

            {/* Summary Cards */}
            <div className="mb-4 grid gap-4 md:grid-cols-4">
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
                            Item terjual
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Quantity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_quantity.toLocaleString('id-ID')}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Unit terjual
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_revenue)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Pendapatan
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Profit
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-emerald-500">
                            {formatCurrency(summary.total_profit)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Margin: {summary.profit_margin.toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Item Sales Table */}
            <Card className="content">
                <CardHeader>
                    <CardTitle>Detail Penjualan per Item</CardTitle>
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
                                        Quantity
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Transaksi
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Harga Rata-rata
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Cost Rata-rata
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Total Revenue
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Total Cost
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Profit
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Margin
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itemSales.length > 0 ? (
                                    itemSales.map((item) => (
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
                                                {item.total_quantity.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.transaction_count.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.avg_price)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.avg_cost)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    item.total_revenue,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    item.total_cost,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600 dark:text-emerald-500">
                                                {formatCurrency(
                                                    item.total_profit,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.profit_margin.toFixed(2)}%
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={10}
                                            className="text-center text-muted-foreground"
                                        >
                                            Tidak ada data penjualan
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                    <TableCell
                                        className="text-center"
                                        colSpan={2}
                                    >
                                        Total
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {summary.total_quantity.toLocaleString(
                                            'id-ID',
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {summary.total_transactions.toLocaleString(
                                            'id-ID',
                                        )}
                                    </TableCell>
                                    <TableCell colSpan={2}></TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_revenue)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_cost)}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600 dark:text-emerald-500">
                                        {formatCurrency(summary.total_profit)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {summary.profit_margin.toFixed(2)}%
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
