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

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_returns: number;
        total_subtotal: number;
        total_discount1: number;
        total_discount2: number;
        total_after_discount: number;
        total_ppn: number;
        total_amount: number;
        total_cost: number;
        total_profit_adjustment: number;
    };
    byReturnType: Record<string, { count: number; total_amount: number }>;
    byCustomer: Array<{
        customer_id: number | null;
        customer_name: string;
        count: number;
        total_amount: number;
    }>;
    saleReturns: Array<{
        id: number;
        return_number: string;
        return_date: string;
        sale_number: string;
        customer_name: string;
        return_type: string;
        refund_method: string;
        subtotal: number;
        discount1_amount: number;
        discount2_amount: number;
        total_after_discount: number;
        ppn_amount: number;
        total_amount: number;
        total_cost: number;
        total_profit_adjustment: number;
        reason: string;
    }>;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Retur Penjualan', href: '#' },
];

export default function SaleReturnReportIndex({
    dateFrom,
    dateTo,
    summary,
    byReturnType,
    byCustomer,
    saleReturns,
}: PageProps) {
    const saleReturnRoute = () => ({ url: '/reports/sale-return' });

    const { allFilters, handleFilterChange } = useResourceFilters(
        saleReturnRoute,
        {
            search: '',
            status: 'all',
            date_from: dateFrom,
            date_to: dateTo,
            sort_by: 'created_at',
            sort_order: 'desc',
        },
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Retur Penjualan" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Retur Penjualan" />
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
                            `/reports/sale-return/print?${params.toString()}`,
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
                            Total Retur
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_returns}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Transaksi retur
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Subtotal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_subtotal)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Sebelum diskon
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
                            {formatCurrency(
                                summary.total_discount1 +
                                    summary.total_discount2,
                            )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Diskon 1 + Diskon 2
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Retur
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_amount)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Setelah PPN
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* By Return Type */}
            {Object.keys(byReturnType).length > 0 && (
                <Card className="content mb-4">
                    <CardHeader>
                        <CardTitle>Ringkasan per Tipe Retur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center">
                                            Tipe Retur
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Jumlah
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Total
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(byReturnType).map(
                                        ([type, data]) => (
                                            <TableRow
                                                key={type}
                                                className="dark:border-b-2 dark:border-white/25"
                                            >
                                                <TableCell className="text-center">
                                                    {type === 'stock_only'
                                                        ? 'Retur Stok'
                                                        : 'Retur + Refund'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {data.count}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {formatCurrency(
                                                        data.total_amount,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* By Customer */}
            {byCustomer.length > 0 && (
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
                                            Jumlah
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Total
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {byCustomer.map((customer) => (
                                        <TableRow
                                            key={
                                                customer.customer_id ||
                                                'no-customer'
                                            }
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
                                                    customer.total_amount,
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

            {/* Detail Table */}
            <Card className="content">
                <CardHeader>
                    <CardTitle>Detail Retur Penjualan</CardTitle>
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
                                        No. Retur
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Tanggal
                                    </TableHead>
                                    <TableHead className="text-center">
                                        No. Penjualan
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Customer
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Tipe
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Metode Refund
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Subtotal
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Diskon
                                    </TableHead>
                                    <TableHead className="text-right">
                                        PPN
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Total
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {saleReturns.length > 0 ? (
                                    saleReturns.map((returnItem) => (
                                        <TableRow
                                            key={returnItem.id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-mono">
                                                {returnItem.return_number}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {format(
                                                    new Date(
                                                        returnItem.return_date,
                                                    ),
                                                    'dd MMM yyyy',
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center font-mono">
                                                {returnItem.sale_number}
                                            </TableCell>
                                            <TableCell>
                                                {returnItem.customer_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {returnItem.return_type ===
                                                'stock_only'
                                                    ? 'Retur Stok'
                                                    : 'Retur + Refund'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {returnItem.refund_method ===
                                                'reduce_receivable'
                                                    ? 'Kurangi Piutang'
                                                    : 'Cash Refund'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    returnItem.subtotal,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    returnItem.discount1_amount +
                                                        returnItem.discount2_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    returnItem.ppn_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(
                                                    returnItem.total_amount,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableCell
                                            colSpan={10}
                                            className="text-center text-muted-foreground"
                                        >
                                            Tidak ada data retur
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                    <TableCell
                                        className="text-center"
                                        colSpan={6}
                                    >
                                        Total
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_subtotal)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            summary.total_discount1 +
                                                summary.total_discount2,
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_ppn)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_amount)}
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
