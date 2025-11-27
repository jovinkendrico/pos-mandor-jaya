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

interface CustomerSummary {
    customer_id: number | null;
    customer_name: string;
    count: number;
    total_remaining: number;
    age_0_30: number;
    age_31_60: number;
    age_61_90: number;
    age_over_90: number;
}

interface AgingData {
    sale_id: number;
    sale_number: string;
    sale_date: string;
    due_date: string;
    customer_id: number | null;
    customer_name: string;
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
    customerSummary: CustomerSummary[];
    agingData: AgingData[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Piutang Usaha', href: '#' },
];

export default function ReceivableAgingIndex({
    asOfDate,
    summary,
    customerSummary,
    agingData,
}: PageProps) {
    const receivableAgingRoute = () => ({ url: '/reports/receivable-aging' });

    const { allFilters, handleFilterChange } = useResourceFilters(
        receivableAgingRoute,
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
            <Head title="Laporan Piutang Usaha (Aging)" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Piutang Usaha (Aging)" />
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
                            Total Piutang
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.grand_total)}
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                                            Total Piutang
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
                                            <TableCell className="text-center font-semibold">
                                                {formatCurrency(
                                                    customer.total_remaining,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    customer.age_0_30,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-yellow-600 dark:text-yellow-300">
                                                {formatCurrency(
                                                    customer.age_31_60,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-orange-600 dark:text-amber-500">
                                                {formatCurrency(
                                                    customer.age_61_90,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-red-600 dark:text-danger-500">
                                                {formatCurrency(
                                                    customer.age_over_90,
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
                    <CardTitle>Detail Piutang Usaha</CardTitle>
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
                                        Kode
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Tanggal
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Jatuh Tempo
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Customer
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
                                            key={item.sale_id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-mono">
                                                {item.sale_number}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatDatetoString(
                                                    new Date(item.sale_date),
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatDatetoString(
                                                    new Date(item.due_date),
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.customer_name}
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
                                                        className="badge-gray-light"
                                                        variant="outline"
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
                                            Tidak ada data piutang
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
