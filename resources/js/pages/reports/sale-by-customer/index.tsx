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
import { Printer } from 'lucide-react';

interface CustomerSale {
    customer_id: number | null;
    customer_name: string;
    transaction_count: number;
    total_sales: number;
    total_amount: number;
    total_cost: number;
    total_profit: number;
    total_discount: number;
    total_ppn: number;
    profit_margin: number;
    avg_sale_value: number;
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_customers: number;
        total_transactions: number;
        total_sales: number;
        total_amount: number;
        total_cost: number;
        total_profit: number;
        total_discount: number;
        total_ppn: number;
        profit_margin: number;
        avg_sale_value: number;
    };
    customerSales: CustomerSale[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Penjualan per Customer', href: '#' },
];

export default function SaleByCustomerIndex({
    dateFrom,
    dateTo,
    summary,
    customerSales,
}: PageProps) {
    const saleByCustomerRoute = () => ({
        url: '/reports/sale-by-customer',
    });

    const { allFilters, handleFilterChange } = useResourceFilters(
        saleByCustomerRoute,
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
            <Head title="Laporan Penjualan per Customer" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Penjualan per Customer" />
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
                            `/reports/sale-by-customer/print?${params.toString()}`,
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
                            Total Transaksi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_transactions.toLocaleString('id-ID')}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Penjualan
                        </p>
                    </CardContent>
                </Card>
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
                            Setelah diskon
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

            {/* Customer Sales Table */}
            <Card className="content">
                <CardHeader>
                    <CardTitle>Detail Penjualan per Customer</CardTitle>
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
                                    <TableHead className="text-right">
                                        Transaksi
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
                                        Total Cost
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Profit
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Margin
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Rata-rata
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customerSales.length > 0 ? (
                                    customerSales.map((customer) => (
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
                                                {customer.transaction_count.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    customer.total_sales,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    customer.total_discount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    customer.total_ppn,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    customer.total_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    customer.total_cost,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600 dark:text-emerald-500">
                                                {formatCurrency(
                                                    customer.total_profit,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {customer.profit_margin.toFixed(
                                                    2,
                                                )}
                                                %
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    customer.avg_sale_value,
                                                )}
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
                                    <TableCell className="text-center">
                                        Total
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {summary.total_transactions.toLocaleString(
                                            'id-ID',
                                        )}
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
                                    <TableCell className="text-right">
                                        {summary.profit_margin.toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.avg_sale_value)}
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
