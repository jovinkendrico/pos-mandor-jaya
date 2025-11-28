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

interface SupplierPurchase {
    supplier_id: number | null;
    supplier_name: string;
    transaction_count: number;
    total_purchases: number;
    total_subtotal: number;
    total_discount: number;
    total_ppn: number;
    avg_purchase_value: number;
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_suppliers: number;
        total_transactions: number;
        total_purchases: number;
        total_subtotal: number;
        total_discount: number;
        total_ppn: number;
        avg_purchase_value: number;
    };
    supplierPurchases: SupplierPurchase[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Pembelian per Supplier', href: '#' },
];

export default function PurchaseBySupplierIndex({
    dateFrom,
    dateTo,
    summary,
    supplierPurchases,
}: PageProps) {
    const purchaseBySupplierRoute = () => ({
        url: '/reports/purchase-by-supplier',
    });

    const { allFilters, handleFilterChange } = useResourceFilters(
        purchaseBySupplierRoute,
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
            <Head title="Laporan Pembelian per Supplier" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Pembelian per Supplier" />
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
                                    window.open(`/reports/purchase-by-supplier/print?${params.toString()}`, '_blank');
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
                            Total Supplier
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_suppliers}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Supplier aktif
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
                            Pembelian
                        </p>
                    </CardContent>
                </Card>
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
                            Setelah PPN
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Rata-rata
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.avg_purchase_value)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Per transaksi
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Supplier Purchases Table */}
            <Card className="content">
                <CardHeader>
                    <CardTitle>Detail Pembelian per Supplier</CardTitle>
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
                                    <TableHead>Supplier</TableHead>
                                    <TableHead className="text-right">
                                        Transaksi
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
                                        Total Pembelian
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Rata-rata
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {supplierPurchases.length > 0 ? (
                                    supplierPurchases.map((supplier) => (
                                        <TableRow
                                            key={
                                                supplier.supplier_id ||
                                                'no-supplier'
                                            }
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="font-medium">
                                                {supplier.supplier_name}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {supplier.transaction_count.toLocaleString(
                                                    'id-ID'
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    supplier.total_subtotal
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    supplier.total_discount
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    supplier.total_ppn
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(
                                                    supplier.total_purchases
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    supplier.avg_purchase_value
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center text-muted-foreground"
                                        >
                                            Tidak ada data pembelian
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right">
                                        {summary.total_transactions.toLocaleString(
                                            'id-ID'
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_subtotal)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_discount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_ppn)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            summary.total_purchases
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            summary.avg_purchase_value
                                        )}
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

