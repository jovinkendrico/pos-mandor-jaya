import { DatePicker } from '@/components/date-picker';
import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Search, Printer } from 'lucide-react';

interface SupplierSummary {
    supplier_id: number | null;
    supplier_name: string;
    count: number;
    total_remaining: number;
    age_0_30: number;
    age_31_60: number;
    age_61_90: number;
    age_over_90: number;
}

interface AgingData {
    purchase_id: number;
    purchase_number: string;
    purchase_date: string;
    due_date: string;
    supplier_id: number | null;
    supplier_name: string;
    total_amount: number;
    total_paid: number;
    remaining_amount: number;
    days_overdue: number;
    days_until_due: number;
    age_0_30: number;
    age_31_60: number;
    age_61_90: number;
    age_over_90: number;
}

interface PageProps {
    asOfDate: string;
    summary: {
        total_0_30: number;
        total_31_60: number;
        total_61_90: number;
        total_over_90: number;
        grand_total: number;
    };
    supplierSummary: SupplierSummary[];
    agingData: AgingData[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Hutang Usaha', href: '#' },
];

export default function PayableAgingIndex({
    asOfDate,
    summary,
    supplierSummary,
    agingData,
}: PageProps) {
    const payableAgingRoute = () => ({ url: '/reports/payable-aging' });

    const { allFilters, handleFilterChange } = useResourceFilters(
        payableAgingRoute,
        {
            search: '',
            status: 'all',
            date_from: '',
            date_to: '',
            sort_by: 'date',
            sort_order: 'desc',
            as_of_date: asOfDate,
        },
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Hutang Usaha (Aging)" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Hutang Usaha (Aging)" />
            </div>

            <FilterBar
                filters={allFilters}
                onFilterChange={handleFilterChange}
                showDateRange={false}
                showSearch={false}
                showStatus={false}
                showPaymentStatus={false}
                showSort={false}
                additionalFilters={
                    <div className="w-[160px]">
                        <Label htmlFor="as_of_date">Per Tanggal</Label>
                        <DatePicker
                            value={
                                allFilters.as_of_date
                                    ? new Date(allFilters.as_of_date)
                                    : undefined
                            }
                            onChange={(date) =>
                                handleFilterChange({
                                    as_of_date: date
                                        ? format(date, 'yyyy-MM-dd')
                                        : '',
                                })
                            }
                            className="input-box"
                        />
                                                        <Button
                                onClick={() => {
                                    const params = new URLSearchParams({
                                        as_of_date: filters.as_of_date,
                                    });
                                    window.open(`/reports/payable-aging/print?${params.toString()}`, '_blank');
                                }}
                                variant="outline"
                                className="flex-1"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Cetak PDF
                            </Button>
                    </div>
                }
            />

            {/* Summary Cards */}
            <div className="mb-4 grid gap-4 md:grid-cols-5">
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            0-30 Hari
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_0_30)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            31-60 Hari
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">
                            {formatCurrency(summary.total_31_60)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            61-90 Hari
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600 dark:text-amber-500">
                            {formatCurrency(summary.total_61_90)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {'>'} 90 Hari
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-danger-500">
                            {formatCurrency(summary.total_over_90)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Hutang
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.grand_total)}
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                                            Total Hutang
                                        </TableHead>
                                        <TableHead className="text-center">
                                            0-30 Hari
                                        </TableHead>
                                        <TableHead className="text-center">
                                            31-60 Hari
                                        </TableHead>
                                        <TableHead className="text-center">
                                            61-90 Hari
                                        </TableHead>
                                        <TableHead className="text-center">
                                            {'>'} 90 Hari
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
                                            <TableCell className="text-center font-semibold">
                                                {formatCurrency(
                                                    supplier.total_remaining,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    supplier.age_0_30,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-yellow-600 dark:text-yellow-300">
                                                {formatCurrency(
                                                    supplier.age_31_60,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-orange-600 dark:text-amber-500">
                                                {formatCurrency(
                                                    supplier.age_61_90,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-red-600 dark:text-danger-500">
                                                {formatCurrency(
                                                    supplier.age_over_90,
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

            {/* Detail Aging */}
            <Card className="content">
                <CardHeader>
                    <CardTitle>Detail Hutang Usaha</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Per Tanggal: {format(new Date(asOfDate), 'dd MMM yyyy')}
                    </p>
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
                                        Jatuh Tempo
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Supplier
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Total
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Sudah Dibayar
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Sisa
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Status
                                    </TableHead>
                                    <TableHead className="text-right">
                                        0-30
                                    </TableHead>
                                    <TableHead className="text-right">
                                        31-60
                                    </TableHead>
                                    <TableHead className="text-right">
                                        61-90
                                    </TableHead>
                                    <TableHead className="text-right">
                                        {'>'} 90
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agingData.length > 0 ? (
                                    agingData.map((item) => (
                                        <TableRow
                                            key={item.purchase_id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-mono">
                                                {item.purchase_number}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatDatetoString(
                                                    new Date(
                                                        item.purchase_date,
                                                    ),
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatDatetoString(
                                                    new Date(item.due_date),
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.supplier_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    item.total_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    item.total_paid,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {formatCurrency(
                                                    item.remaining_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.days_overdue > 0 ? (
                                                    <Badge className="badge-red-light">
                                                        Telat{' '}
                                                        {item.days_overdue} hari
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="badge-gray-light"
                                                    >
                                                        Sisa{' '}
                                                        {item.days_until_due}{' '}
                                                        hari
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.age_0_30)}
                                            </TableCell>
                                            <TableCell className="text-right text-yellow-600 dark:text-yellow-300">
                                                {formatCurrency(item.age_31_60)}
                                            </TableCell>
                                            <TableCell className="text-right text-orange-600 dark:text-amber-500">
                                                {formatCurrency(item.age_61_90)}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600 dark:text-danger-500">
                                                {formatCurrency(
                                                    item.age_over_90,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableCell
                                            colSpan={12}
                                            className="text-center"
                                        >
                                            Tidak ada data hutang
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                    <TableCell
                                        colSpan={8}
                                        className="text-center"
                                    >
                                        Total
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_0_30)}
                                    </TableCell>
                                    <TableCell className="text-right text-yellow-600 dark:text-yellow-300">
                                        {formatCurrency(summary.total_31_60)}
                                    </TableCell>
                                    <TableCell className="text-right text-orange-600 dark:text-amber-500">
                                        {formatCurrency(summary.total_61_90)}
                                    </TableCell>
                                    <TableCell className="text-right text-red-600 dark:text-danger-500">
                                        {formatCurrency(summary.total_over_90)}
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
