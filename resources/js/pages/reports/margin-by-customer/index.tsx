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
import { formatCurrency } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { AlertTriangle, Printer, TrendingUp } from 'lucide-react';
import { useRef } from 'react';

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_customers: number;
        total_revenue: number;
        total_cost: number;
        total_profit: number;
        total_discount: number;
        avg_profit_margin: number;
    };
    marginData: Array<{
        customer_id: number | null;
        customer_name: string;
        transaction_count: number;
        total_revenue: number;
        total_cost: number;
        total_profit: number;
        total_discount: number;
        avg_sale_value: number;
        profit_margin: number;
        profit_per_transaction: number;
    }>;
    topProfitable: Array<{
        customer_id: number | null;
        customer_name: string;
        total_profit: number;
        profit_margin: number;
    }>;
    leastProfitable: Array<{
        customer_id: number | null;
        customer_name: string;
        total_profit: number;
        profit_margin: number;
    }>;
    negativeMargin: Array<{
        customer_id: number | null;
        customer_name: string;
        total_profit: number;
        profit_margin: number;
    }>;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports' },
    { title: 'Laporan Analisis Margin per Customer', href: '#' },
];

export default function MarginByCustomerReportIndex({
    dateFrom,
    dateTo,
    summary,
    marginData,
    topProfitable,
    negativeMargin,
}: PageProps) {
    const marginByCustomerRoute = () => ({
        url: '/reports/margin-by-customer',
    });

    const defaultParams = useRef({
        search: '',
        status: 'all',
        date_from: dateFrom,
        date_to: dateTo,
        sort_by: 'profit_margin',
        sort_order: 'desc',
    }).current;

    const { allFilters, handleFilterChange } = useResourceFilters(
        marginByCustomerRoute,
        defaultParams,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Analisis Margin per Customer" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Analisis Margin per Customer" />
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
                            `/reports/margin-by-customer/print?${params.toString()}`,
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
            <div className="mb-4 grid gap-4 md:grid-cols-4">
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Customer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_customers}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Customer aktif
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
                            Keuntungan
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Rata-rata Margin
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.avg_profit_margin.toFixed(2)}%
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Profit margin
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Profitable */}
            {topProfitable.length > 0 && (
                <Card className="content mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-emerald-500" />
                            Top 10 Customer Paling Profitable
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center">
                                            Customer
                                        </TableHead>
                                        <TableHead className="text-cener">
                                            Total Profit
                                        </TableHead>
                                        <TableHead className="text-cener">
                                            Margin
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topProfitable.map((customer) => (
                                        <TableRow
                                            key={
                                                customer.customer_id ||
                                                'no-customer'
                                            }
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-medium">
                                                {customer.customer_name}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold text-green-600 dark:text-emerald-500">
                                                {formatCurrency(
                                                    customer.total_profit,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {customer.profit_margin.toFixed(
                                                    2,
                                                )}
                                                %
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Negative Margin */}
            {negativeMargin.length > 0 && (
                <Card className="content mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-danger-500" />
                            Customer dengan Margin Negatif (Perlu Perhatian)
                        </CardTitle>
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
                                            Total Profit
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Margin
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {negativeMargin.map((customer) => (
                                        <TableRow
                                            key={
                                                customer.customer_id ||
                                                'no-customer'
                                            }
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="font-medium">
                                                {customer.customer_name}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold text-red-600 dark:text-danger-500">
                                                {formatCurrency(
                                                    customer.total_profit,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-red-600 dark:text-danger-500">
                                                {customer.profit_margin.toFixed(
                                                    2,
                                                )}
                                                %
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Full Margin Data */}
            <Card className="content">
                <CardHeader>
                    <CardTitle>Detail Analisis Margin per Customer</CardTitle>
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
                                        Customer
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Transaksi
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Revenue
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Cost
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Diskon
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Profit
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Margin
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Profit/Transaksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {marginData.length > 0 ? (
                                    marginData.map((customer) => (
                                        <TableRow
                                            key={
                                                customer.customer_id ||
                                                'no-customer'
                                            }
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-medium">
                                                {customer.customer_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {customer.transaction_count}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    customer.total_revenue,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    customer.total_cost,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    customer.total_discount,
                                                )}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right font-semibold ${customer.total_profit >= 0 ? 'text-green-600 dark:text-emerald-500' : 'text-red-600 dark:text-danger-500'}`}
                                            >
                                                {formatCurrency(
                                                    customer.total_profit,
                                                )}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right ${customer.profit_margin >= 0 ? '' : 'text-red-600 dark:text-danger-500'}`}
                                            >
                                                {customer.profit_margin.toFixed(
                                                    2,
                                                )}
                                                %
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    customer.profit_per_transaction,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="text-center text-muted-foreground"
                                        >
                                            Tidak ada data
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary/10">
                                    <TableCell className="text-center">
                                        Total
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {marginData.reduce(
                                            (sum, c) =>
                                                sum + c.transaction_count,
                                            0,
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_revenue)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_cost)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_discount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_profit)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {summary.avg_profit_margin.toFixed(2)}%
                                    </TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
