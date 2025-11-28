import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Badge } from '@/components/ui/badge';
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
import { cn, formatCurrency } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Search, Printer } from 'lucide-react';

interface BankCashFlow {
    bank_id: number;
    bank_name: string;
    bank_type: string;
    opening_balance: number;
    cash_in: number;
    cash_out: number;
    net_cash_flow: number;
    closing_balance: number;
}

interface DailyCashFlow {
    date: string;
    date_formatted: string;
    cash_in: number;
    cash_out: number;
    net_flow: number;
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_opening_balance: number;
        total_cash_in: number;
        total_cash_out: number;
        total_net_flow: number;
        total_closing_balance: number;
    };
    bankCashFlow: BankCashFlow[];
    dailyCashFlow: DailyCashFlow[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Arus Kas', href: '#' },
];

export default function CashFlowIndex({
    dateFrom,
    dateTo,
    summary,
    bankCashFlow,
    dailyCashFlow,
}: PageProps) {
    const cashFlowRoute = () => ({ url: '/reports/cash-flow' });

    const { allFilters, handleFilterChange } = useResourceFilters(
        cashFlowRoute,
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
            <Head title="Laporan Arus Kas" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Arus Kas" />
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
                                    window.open(`/reports/cash-flow/print?${params.toString()}`, '_blank');
                                }}
                                variant="outline"
                                className="flex-1"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Cetak PDF
                            </Button>

            {/* Summary Cards */}
            <div className="mb-4 grid gap-4 md:grid-cols-5">
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Saldo Awal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_opening_balance)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Kas Masuk
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-emerald-500">
                            {formatCurrency(summary.total_cash_in)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Kas Keluar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-danger-500">
                            {formatCurrency(summary.total_cash_out)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Net Flow
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`text-2xl font-bold ${
                                summary.total_net_flow >= 0
                                    ? 'text-green-600 dark:text-emerald-500'
                                    : 'text-red-600 dark:text-danger-500'
                            }`}
                        >
                            {formatCurrency(summary.total_net_flow)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Saldo Akhir
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_closing_balance)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bank Cash Flow */}
            {bankCashFlow.length > 0 && (
                <Card className="content mb-4">
                    <CardHeader>
                        <CardTitle>Arus Kas per Bank/Kas</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Periode: {format(new Date(dateFrom), 'dd MMM yyyy')}{' '}
                            - {format(new Date(dateTo), 'dd MMM yyyy')}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center">
                                            Bank/Kas
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Tipe
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Saldo Awal
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Kas Masuk
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Kas Keluar
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Net Flow
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Saldo Akhir
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bankCashFlow.map((bank) => (
                                        <TableRow
                                            key={bank.bank_id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-medium">
                                                {bank.bank_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        bank.bank_type ===
                                                            'bank'
                                                            ? 'badge-green-light'
                                                            : 'badge-yellow-light',
                                                    )}
                                                >
                                                    {bank.bank_type === 'bank'
                                                        ? 'Bank'
                                                        : 'Cash'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    bank.opening_balance,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600 dark:text-emerald-500">
                                                {formatCurrency(bank.cash_in)}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600 dark:text-danger-500">
                                                {formatCurrency(bank.cash_out)}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right font-semibold ${
                                                    bank.net_cash_flow >= 0
                                                        ? 'text-green-600 dark:text-emerald-500'
                                                        : 'text-red-600 dark:text-danger-500'
                                                }`}
                                            >
                                                {formatCurrency(
                                                    bank.net_cash_flow,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(
                                                    bank.closing_balance,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                        <TableCell
                                            className="text-center"
                                            colSpan={2}
                                        >
                                            Total
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(
                                                summary.total_opening_balance,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 dark:text-emerald-500">
                                            {formatCurrency(
                                                summary.total_cash_in,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600 dark:text-danger-500">
                                            {formatCurrency(
                                                summary.total_cash_out,
                                            )}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right ${
                                                summary.total_net_flow >= 0
                                                    ? 'text-green-600 dark:text-emerald-500'
                                                    : 'text-red-600 dark:text-danger-500'
                                            }`}
                                        >
                                            {formatCurrency(
                                                summary.total_net_flow,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(
                                                summary.total_closing_balance,
                                            )}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Daily Cash Flow */}
            {dailyCashFlow.length > 0 && (
                <Card className="content">
                    <CardHeader>
                        <CardTitle>Arus Kas Harian</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-right">
                                            Kas Masuk
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Kas Keluar
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Net Flow
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dailyCashFlow.map((day, index) => (
                                        <TableRow
                                            key={index}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell>
                                                {day.date_formatted}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600 dark:text-emerald-500">
                                                {formatCurrency(day.cash_in)}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600 dark:text-danger-500">
                                                {formatCurrency(day.cash_out)}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right font-semibold ${
                                                    day.net_flow >= 0
                                                        ? 'text-green-600 dark:text-emerald-500'
                                                        : 'text-red-600 dark:text-danger-500'
                                                }`}
                                            >
                                                {formatCurrency(day.net_flow)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </AppLayout>
    );
}
