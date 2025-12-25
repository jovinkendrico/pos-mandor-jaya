import FilterBar from '@/components/transaction/filter-bar';
import PageTitle from '@/components/page-title';
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
        total_payments: number;
        total_amount: number;
    };
    byPaymentMethod: Record<string, { count: number; total_amount: number }>;
    byBank: Array<{
        bank_id: number;
        bank_name: string;
        count: number;
        total_amount: number;
    }>;
    bySupplier: Array<{
        supplier_id: number | null;
        supplier_name: string;
        count: number;
        total_amount: number;
    }>;
    purchasePayments: Array<{
        id: number;
        payment_number: string;
        payment_date: string;
        bank_name: string;
        payment_method: string;
        reference_number: string;
        total_amount: number;
        notes: string;
        purchases_count: number;
    }>;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Pembayaran Pembelian', href: '#' },
];

export default function PurchasePaymentReportIndex({
    dateFrom,
    dateTo,
    summary,
    byPaymentMethod,
    byBank,
    bySupplier,
    purchasePayments,
}: PageProps) {
    const purchasePaymentRoute = () => ({ url: '/reports/purchase-payment' });

    const { allFilters, handleFilterChange } = useResourceFilters(
        purchasePaymentRoute,
        {
            search: '',
            status: 'all',
            date_from: dateFrom,
            date_to: dateTo,
            sort_by: 'created_at',
            sort_order: 'desc',
        },
    );

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            cash: 'Tunai',
            transfer: 'Transfer',
            giro: 'Giro',
            cek: 'Cek',
            other: 'Lainnya',
            refund: 'Refund',
        };
        return labels[method] || method;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Pembayaran Pembelian" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Pembayaran Pembelian" />
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
                            `/reports/purchase-payment/print?${params.toString()}`,
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
            <div className="mb-4 grid gap-4 md:grid-cols-2">
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Pembayaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_payments}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Transaksi pembayaran
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Jumlah
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_amount)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Total pembayaran
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* By Payment Method */}
            {Object.keys(byPaymentMethod).length > 0 && (
                <Card className="content mb-4">
                    <CardHeader>
                        <CardTitle>Ringkasan per Metode Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center">
                                            Metode
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
                                    {Object.entries(byPaymentMethod).map(
                                        ([method, data]) => (
                                            <TableRow
                                                key={method}
                                                className="dark:border-b-2 dark:border-white/25"
                                            >
                                                <TableCell className="text-center">
                                                    {getPaymentMethodLabel(
                                                        method,
                                                    )}
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

            {/* By Bank */}
            {byBank.length > 0 && (
                <Card className="content mb-4">
                    <CardHeader>
                        <CardTitle>Ringkasan per Bank</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center">
                                            Bank
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
                                    {byBank.map((bank) => (
                                        <TableRow
                                            key={bank.bank_id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center">
                                                {bank.bank_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {bank.count}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    bank.total_amount,
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

            {/* By Supplier */}
            {bySupplier.length > 0 && (
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
                                            Jumlah
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Total
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bySupplier.map((supplier) => (
                                        <TableRow
                                            key={
                                                supplier.supplier_id ||
                                                'no-supplier'
                                            }
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

            {/* Detail Table */}
            <Card className="content">
                <CardHeader>
                    <CardTitle>Detail Pembayaran Pembelian</CardTitle>
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
                                        No. Pembayaran
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Tanggal
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Bank
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Metode
                                    </TableHead>
                                    <TableHead className="text-center">
                                        No. Referensi
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Jumlah Pembelian
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Total
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchasePayments.length > 0 ? (
                                    purchasePayments.map((payment) => (
                                        <TableRow
                                            key={payment.id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-mono">
                                                {payment.payment_number}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {format(
                                                    new Date(
                                                        payment.payment_date,
                                                    ),
                                                    'dd MMM yyyy',
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {payment.bank_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getPaymentMethodLabel(
                                                    payment.payment_method,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {payment.reference_number ||
                                                    '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {payment.purchases_count}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(
                                                    payment.total_amount,
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
                                            Tidak ada data pembayaran
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

