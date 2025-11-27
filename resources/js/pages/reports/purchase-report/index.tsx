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
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';

interface DailySummary {
    date: string;
    date_formatted: string;
    count: number;
    total_purchases: number;
    total_ppn: number;
    total_amount: number;
    total_discount: number;
}

interface SupplierSummary {
    supplier_id: number | null;
    supplier_name: string;
    count: number;
    total_purchases: number;
    total_amount: number;
}

interface Purchase {
    id: number;
    purchase_number: string;
    purchase_date: string;
    supplier_name: string;
    total_after_discount: number;
    discount1_amount: number;
    discount2_amount: number;
    ppn_amount: number;
    total_amount: number;
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_purchases: number;
        total_ppn: number;
        total_amount: number;
        total_discount: number;
        total_transactions: number;
        avg_purchase_value: number;
    };
    dailySummary: DailySummary[];
    supplierSummary: SupplierSummary[];
    purchases: Purchase[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Pembelian', href: '#' },
];

export default function PurchaseReportIndex({
    dateFrom,
    dateTo,
    summary,
    dailySummary,
    supplierSummary,
    purchases,
}: PageProps) {
    const purchaseReportRoute = () => ({ url: '/reports/purchase-report' });

    const { allFilters, handleFilterChange } = useResourceFilters(
        purchaseReportRoute,
        {
            search: '',
            status: 'all',
            date_from: dateFrom,
            date_to: dateTo,
            sort_by: 'date',
            sort_order: 'desc',
        }
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Pembelian" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Pembelian" />
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

            {/* Summary Cards */}
            <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Pembelian
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_purchases)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Tanpa PPN
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
                            Rata-rata:{' '}
                            {formatCurrency(summary.avg_purchase_value)}
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
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Amount
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
                                        Total Pembelian
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
                                                    day.total_purchases,
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
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableCell
                                            colSpan={6}
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
                                        {formatCurrency(
                                            summary.total_purchases,
                                        )}
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
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Supplier Summary */}
            {supplierSummary.length > 0 && (
                <Card className="content mb-4">
                    <CardHeader>
                        <CardTitle>Ringkasan per Supplier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center">
                                            Supplier
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Jumlah Transaksi
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Total Pembelian
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Total Amount
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {supplierSummary.map((supplier, index) => (
                                        <TableRow
                                            key={index}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center">
                                                {supplier.supplier_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {supplier.count}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    supplier.total_purchases,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    supplier.total_amount,
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

            {/* Detail Purchases */}
            <Card className="content">
                <CardHeader>
                    <CardTitle>Detail Transaksi Pembelian</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="input-box overflow-x-auto rounded-lg">
                        <Table className="content">
                            <TableHeader>
                                <TableRow className="dark:border-b-2 dark:border-white/25">
                                    <TableHead className="text-center">
                                        No. Pembelian
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Tanggal
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Supplier
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Pembelian
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.length > 0 ? (
                                    purchases.map((purchase) => (
                                        <TableRow
                                            key={purchase.id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-mono">
                                                {purchase.purchase_number}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatDatetoString(
                                                    new Date(
                                                        purchase.purchase_date,
                                                    ),
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {purchase.supplier_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    purchase.total_after_discount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    purchase.discount1_amount +
                                                        purchase.discount2_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    purchase.ppn_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    purchase.total_amount,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableCell
                                            colSpan={7}
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
