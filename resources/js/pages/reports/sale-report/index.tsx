import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
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
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';

interface DailySummary {
    date: string;
    date_formatted: string;
    count: number;
    total_sales: number;
    total_ppn: number;
    total_amount: number;
    total_discount: number;
    total_cost: number;
    total_profit: number;
}

interface CustomerSummary {
    customer_id: number | null;
    customer_name: string;
    count: number;
    total_sales: number;
    total_amount: number;
    total_profit: number;
}

interface Sale {
    id: number;
    sale_number: string;
    sale_date: string;
    customer_name: string;
    subtotal: number;
    total_after_discount: number;
    discount1_amount: number;
    discount2_amount: number;
    ppn_amount: number;
    total_amount: number;
    total_cost: number;
    total_profit: number;
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_sales: number;
        total_ppn: number;
        total_amount: number;
        total_discount: number;
        total_cost: number;
        total_profit: number;
        total_transactions: number;
        profit_margin: number;
        avg_sale_value: number;
        avg_profit: number;
    };
    dailySummary: DailySummary[];
    customerSummary: CustomerSummary[];
    sales: Sale[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Penjualan', href: '#' },
];

export default function SaleReportIndex({
    dateFrom,
    dateTo,
    summary,
    dailySummary,
    customerSummary,
    sales,
}: PageProps) {
    const saleReportRoute = () => ({ url: '/reports/sale-report' });

    const { allFilters, handleFilterChange } = useResourceFilters(
        saleReportRoute,
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
            <Head title="Laporan Penjualan" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Penjualan" />
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
            <div className="flex w-full justify-end">
                <Button
                    onClick={() => {
                        const params = new URLSearchParams({
                            date_from: allFilters.date_from,
                            date_to: allFilters.date_to,
                        });
                        window.open(
                            `/reports/sale-report/print?${params.toString()}`,
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
            <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Penjualan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_sales)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Tanpa PPN
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
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Transaksi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_transactions}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Rata-rata: {formatCurrency(summary.avg_sale_value)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Diskon
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_discount)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            PPN: {formatCurrency(summary.total_ppn)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Summary */}
            <Card className="content mb-4">
                <CardHeader>
                    <CardTitle>Ringkasan Harian</CardTitle>
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
                                        Tanggal
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Jumlah Transaksi
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Total Penjualan
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Diskon
                                    </TableHead>
                                    <TableHead className="text-right">
                                        PPN
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Total Amount
                                    </TableHead>
                                    <TableHead className="text-right">
                                        HPP
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Profit
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailySummary.length > 0 ? (
                                    dailySummary.map((day, index) => (
                                        <TableRow
                                            key={index}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center">
                                                {day.date_formatted}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {day.count}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    day.total_sales,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    day.total_discount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(day.total_ppn)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    day.total_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(day.total_cost)}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {formatCurrency(
                                                    day.total_profit,
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
                                            Tidak ada data
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                    <TableCell className="text-center">
                                        Total
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {summary.total_transactions}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_sales)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_discount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_ppn)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_cost)}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600 dark:text-emerald-500">
                                        {formatCurrency(summary.total_profit)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Customer Summary */}
            {customerSummary.length > 0 && (
                <Card className="content mb-4">
                    <CardHeader>
                        <CardTitle>Ringkasan per Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center">
                                            Customer
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Jumlah Transaksi
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Total Penjualan
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Total Amount
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Profit
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customerSummary.map((customer, index) => (
                                        <TableRow
                                            key={index}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center">
                                                {customer.customer_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {customer.count}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    customer.total_sales,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    customer.total_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-green-600">
                                                {formatCurrency(
                                                    customer.total_profit,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detail Sales */}
            <Card className="content">
                <CardHeader>
                    <CardTitle>Detail Transaksi Penjualan</CardTitle>
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
                                        Tanggal
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Customer
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Penjualan
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Diskon
                                    </TableHead>
                                    <TableHead className="text-center">
                                        PPN
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Total
                                    </TableHead>
                                    <TableHead className="text-center">
                                        HPP
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Profit
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.length > 0 ? (
                                    sales.map((sale) => (
                                        <TableRow
                                            key={sale.id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-mono">
                                                {sale.sale_number}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatDatetoString(
                                                    new Date(sale.sale_date),
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {sale.customer_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    sale.total_after_discount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    sale.discount1_amount +
                                                        sale.discount2_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    sale.ppn_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    sale.total_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    sale.total_cost,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-green-600 dark:text-emerald-500">
                                                {formatCurrency(
                                                    sale.total_profit,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
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
