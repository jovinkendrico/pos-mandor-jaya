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
import { Printer, TrendingDown, TrendingUp } from 'lucide-react';

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_cash_in: number;
        total_cash_in_amount: number;
        total_cash_out: number;
        total_cash_out_amount: number;
        net_cash_flow: number;
    };
    cashInByBank: Array<{
        bank_id: number;
        bank_name: string;
        count: number;
        total_amount: number;
    }>;
    cashOutByBank: Array<{
        bank_id: number;
        bank_name: string;
        count: number;
        total_amount: number;
    }>;
    cashInByAccount: Array<{
        account_id: number;
        account_code: string;
        account_name: string;
        count: number;
        total_amount: number;
    }>;
    cashOutByAccount: Array<{
        account_id: number;
        account_code: string;
        account_name: string;
        count: number;
        total_amount: number;
    }>;
    cashIns: Array<{
        id: number;
        cash_in_number: string;
        cash_in_date: string;
        bank_name: string;
        account_code: string;
        account_name: string;
        amount: number;
        description: string;
    }>;
    cashOuts: Array<{
        id: number;
        cash_out_number: string;
        cash_out_date: string;
        bank_name: string;
        account_code: string;
        account_name: string;
        amount: number;
        description: string;
    }>;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Kas Masuk/Keluar', href: '#' },
];

export default function CashInOutReportIndex({
    dateFrom,
    dateTo,
    summary,
    cashInByBank,
    cashOutByBank,
    cashInByAccount,
    cashOutByAccount,
    cashIns,
    cashOuts,
}: PageProps) {
    const cashInOutRoute = () => ({ url: '/reports/cash-in-out' });

    const { allFilters, handleFilterChange } = useResourceFilters(
        cashInOutRoute,
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
            <Head title="Laporan Kas Masuk/Keluar" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Kas Masuk/Keluar" />
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
                            `/reports/cash-in-out/print?${params.toString()}`,
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

            <div className="mb-4 grid gap-4 md:grid-cols-5">
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-emerald-500" />
                            Kas Masuk
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-emerald-500">
                            {summary.total_cash_in}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Transaksi
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Kas Masuk
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-emerald-500">
                            {formatCurrency(summary.total_cash_in_amount)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Jumlah masuk
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-danger-500" />
                            Kas Keluar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-danger-500">
                            {summary.total_cash_out}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Transaksi
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Kas Keluar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-danger-500">
                            {formatCurrency(summary.total_cash_out_amount)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Jumlah keluar
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Net Cash Flow
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`text-2xl font-bold ${summary.net_cash_flow >= 0 ? 'text-green-600 dark:text-emerald-500' : 'text-red-600 dark:text-danger-500'}`}
                        >
                            {formatCurrency(summary.net_cash_flow)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Saldo bersih
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-2">
                {cashInByBank.length > 0 && (
                    <Card className="content">
                        <CardHeader>
                            <CardTitle>Kas Masuk per Bank</CardTitle>
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
                                        {cashInByBank.map((bank) => (
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
                                                <TableCell className="text-right text-green-600 dark:text-emerald-500">
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

                {cashOutByBank.length > 0 && (
                    <Card className="content">
                        <CardHeader>
                            <CardTitle>Kas Keluar per Bank</CardTitle>
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
                                        {cashOutByBank.map((bank) => (
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
                                                <TableCell className="text-right text-red-600 dark:text-danger-500">
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
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-2">
                {cashInByAccount.length > 0 && (
                    <Card className="content">
                        <CardHeader>
                            <CardTitle>Kas Masuk per Akun</CardTitle>
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
                                                Nama Akun
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
                                        {cashInByAccount.map((account) => (
                                            <TableRow
                                                key={account.account_id}
                                                className="dark:border-b-2 dark:border-white/25"
                                            >
                                                <TableCell className="text-center font-mono">
                                                    {account.account_code}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {account.account_name}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {account.count}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600 dark:text-emerald-500">
                                                    {formatCurrency(
                                                        account.total_amount,
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

                {cashOutByAccount.length > 0 && (
                    <Card className="content">
                        <CardHeader>
                            <CardTitle>Kas Keluar per Akun</CardTitle>
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
                                                Nama Akun
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
                                        {cashOutByAccount.map((account) => (
                                            <TableRow
                                                key={account.account_id}
                                                className="dark:border-b-2 dark:border-white/25"
                                            >
                                                <TableCell className="text-center font-mono">
                                                    {account.account_code}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {account.account_name}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {account.count}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600 dark:text-danger-500">
                                                    {formatCurrency(
                                                        account.total_amount,
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="content">
                    <CardHeader>
                        <CardTitle>Detail Kas Masuk</CardTitle>
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
                                            No.
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Tanggal
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Bank
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Akun
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Jumlah
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cashIns.length > 0 ? (
                                        cashIns.map((cashIn) => (
                                            <TableRow
                                                key={cashIn.id}
                                                className="dark:border-b-2 dark:border-white/25"
                                            >
                                                <TableCell className="text-center font-mono">
                                                    {cashIn.cash_in_number}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {format(
                                                        new Date(
                                                            cashIn.cash_in_date,
                                                        ),
                                                        'dd MMM yyyy',
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {cashIn.bank_name}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {cashIn.account_name}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-green-600 dark:text-emerald-500">
                                                    {formatCurrency(
                                                        cashIn.amount,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="dark:border-b-2 dark:border-white/25">
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-muted-foreground"
                                            >
                                                Tidak ada data kas masuk
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {cashIns.length > 0 && (
                                        <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                            <TableCell
                                                className="text-center"
                                                colSpan={4}
                                            >
                                                Total
                                            </TableCell>
                                            <TableCell className="text-right text-green-600 dark:text-emerald-500">
                                                {formatCurrency(
                                                    summary.total_cash_in_amount,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="content">
                    <CardHeader>
                        <CardTitle>Detail Kas Keluar</CardTitle>
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
                                            No.
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Tanggal
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Bank
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Akun
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Jumlah
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cashOuts.length > 0 ? (
                                        cashOuts.map((cashOut) => (
                                            <TableRow
                                                key={cashOut.id}
                                                className="dark:border-b-2 dark:border-white/25"
                                            >
                                                <TableCell className="text-center font-mono">
                                                    {cashOut.cash_out_number}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {format(
                                                        new Date(
                                                            cashOut.cash_out_date,
                                                        ),
                                                        'dd MMM yyyy',
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {cashOut.bank_name}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {cashOut.account_name}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-red-600 dark:text-danger-500">
                                                    {formatCurrency(
                                                        cashOut.amount,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="dark:border-b-2 dark:border-white/25">
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-muted-foreground"
                                            >
                                                Tidak ada data kas keluar
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {cashOuts.length > 0 && (
                                        <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                            <TableCell
                                                className="text-center"
                                                colSpan={4}
                                            >
                                                Total
                                            </TableCell>
                                            <TableCell className="text-right text-red-600 dark:text-danger-500">
                                                {formatCurrency(
                                                    summary.total_cash_out_amount,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
