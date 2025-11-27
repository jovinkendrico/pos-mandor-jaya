import { DatePicker } from '@/components/date-picker';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
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
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface IncomeDetail {
    code: string;
    name: string;
    amount: number;
}

interface ExpenseDetail {
    code: string;
    name: string;
    amount: number;
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    incomeDetails: IncomeDetail[];
    expenseDetails: ExpenseDetail[];
    totalIncome: number;
    totalHPP: number;
    grossProfit: number;
    totalExpense: number;
    netProfit: number;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Laba Rugi', href: '#' },
];

export default function ProfitLossIndex({
    dateFrom,
    dateTo,
    incomeDetails,
    expenseDetails,
    totalIncome,
    totalHPP,
    grossProfit,
    totalExpense,
    netProfit,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
    });

    const handleFilter = () => {
        router.get('/profit-loss', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Laba Rugi" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Laba Rugi" />
            </div>

            <Card className="content mb-4">
                <CardHeader>
                    <CardTitle>Filter Periode</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="date_from">Dari Tanggal</Label>
                            <DatePicker
                                value={
                                    filters.date_from
                                        ? new Date(filters.date_from)
                                        : undefined
                                }
                                onChange={(date) =>
                                    setFilters({
                                        ...filters,
                                        date_from: date
                                            ? format(date, 'yyyy-MM-dd')
                                            : '',
                                    })
                                }
                                className="input-box"
                            />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="date_to">Sampai Tanggal</Label>
                            <DatePicker
                                value={
                                    filters.date_to
                                        ? new Date(filters.date_to)
                                        : undefined
                                }
                                onChange={(date) =>
                                    setFilters({
                                        ...filters,
                                        date_to: date
                                            ? format(date, 'yyyy-MM-dd')
                                            : '',
                                    })
                                }
                                className="input-box"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={handleFilter}
                                className="btn-primary"
                            >
                                <Search className="mr-2 h-4 w-4" />
                                Tampilkan
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="content">
                <CardHeader>
                    <CardTitle>Laporan Laba Rugi</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} -{' '}
                        {format(new Date(dateTo), 'dd MMM yyyy')}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Pendapatan */}
                        <div>
                            <h3 className="mb-3 text-lg font-semibold">
                                Pendapatan
                            </h3>
                            <div className="input-box overflow-x-auto rounded-lg">
                                <Table className="content">
                                    <TableHeader>
                                        <TableRow className="dark:border-b-2 dark:border-white/25">
                                            <TableHead>Kode</TableHead>
                                            <TableHead>Nama Akun</TableHead>
                                            <TableHead className="text-right">
                                                Jumlah
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {incomeDetails.length > 0 ? (
                                            incomeDetails.map((item, index) => (
                                                <TableRow
                                                    key={index}
                                                    className="dark:border-b-2 dark:border-white/25"
                                                >
                                                    <TableCell>
                                                        {item.code}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.name}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(
                                                            item.amount,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow className="dark:border-b-2 dark:border-white/25">
                                                <TableCell
                                                    colSpan={3}
                                                    className="text-center text-muted-foreground"
                                                >
                                                    Tidak ada data pendapatan
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow className="font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                            <TableCell colSpan={2}>
                                                Total Pendapatan
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(totalIncome)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* HPP */}
                        {totalHPP > 0 && (
                            <div>
                                <h3 className="mb-3 text-lg font-semibold">
                                    Harga Pokok Penjualan (HPP)
                                </h3>
                                <div className="input-box overflow-x-auto rounded-lg">
                                    <Table className="content">
                                        <TableHeader>
                                            <TableRow className="dark:border-b-2 dark:border-white/25">
                                                <TableHead colSpan={2}>
                                                    HPP
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Jumlah
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow className="dark:border-b-2 dark:border-white/25">
                                                <TableCell colSpan={2}>
                                                    Harga Pokok Penjualan
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(totalHPP)}
                                                </TableCell>
                                            </TableRow>
                                            <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                                <TableCell colSpan={2}>
                                                    Total HPP
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(totalHPP)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {/* Laba Kotor */}
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    Laba Kotor
                                </h3>
                                <p className="text-lg font-semibold">
                                    {formatCurrency(grossProfit)}
                                </p>
                            </div>
                        </div>

                        {/* Biaya */}
                        <div>
                            <h3 className="mb-3 text-lg font-semibold">
                                Biaya Operasional
                            </h3>
                            <div className="input-box overflow-x-auto rounded-lg">
                                <Table className="content">
                                    <TableHeader>
                                        <TableRow className="dark:border-b-2 dark:border-white/25">
                                            <TableHead>Kode</TableHead>
                                            <TableHead>Nama Akun</TableHead>
                                            <TableHead className="text-right">
                                                Jumlah
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expenseDetails.length > 0 ? (
                                            expenseDetails.map(
                                                (item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            {item.code}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.name}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(
                                                                item.amount,
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )
                                        ) : (
                                            <TableRow className="dark:border-b-2 dark:border-white/25">
                                                <TableCell
                                                    colSpan={3}
                                                    className="text-center text-muted-foreground"
                                                >
                                                    Tidak ada data biaya
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                            <TableCell colSpan={2}>
                                                Total Biaya
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(totalExpense)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Laba Bersih */}
                        <div className="border-t-2 pt-4 dark:border-white/25">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">
                                    {netProfit >= 0
                                        ? 'Laba Bersih'
                                        : 'Rugi Bersih'}
                                </h3>
                                <p
                                    className={`text-xl font-bold ${
                                        netProfit >= 0
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                    }`}
                                >
                                    {formatCurrency(netProfit)}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
