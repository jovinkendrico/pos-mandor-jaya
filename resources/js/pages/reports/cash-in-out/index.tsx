import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { DatePicker } from '@/components/date-picker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';

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
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
    });

    const handleFilter = () => {
        router.get('/reports/cash-in-out', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Kas Masuk/Keluar" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Kas Masuk/Keluar" />
            </div>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Filter Periode</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date_from">Dari Tanggal</Label>
                            <DatePicker
                                value={filters.date_from ? new Date(filters.date_from) : undefined}
                                onChange={(date) =>
                                    setFilters({
                                        ...filters,
                                        date_from: date ? format(date, 'yyyy-MM-dd') : '',
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date_to">Sampai Tanggal</Label>
                            <DatePicker
                                value={filters.date_to ? new Date(filters.date_to) : undefined}
                                onChange={(date) =>
                                    setFilters({
                                        ...filters,
                                        date_to: date ? format(date, 'yyyy-MM-dd') : '',
                                    })
                                }
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleFilter} className="w-full">
                                <Search className="mr-2 h-4 w-4" />
                                Tampilkan
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-5 mb-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            Kas Masuk
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary.total_cash_in}</div>
                        <p className="text-xs text-muted-foreground mt-1">Transaksi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Kas Masuk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_cash_in_amount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Jumlah masuk</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            Kas Keluar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary.total_cash_out}</div>
                        <p className="text-xs text-muted-foreground mt-1">Transaksi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Kas Keluar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_cash_out_amount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Jumlah keluar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(summary.net_cash_flow)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Saldo bersih</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-4">
                {cashInByBank.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Kas Masuk per Bank</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bank</TableHead>
                                            <TableHead className="text-right">Jumlah</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cashInByBank.map((bank) => (
                                            <TableRow key={bank.bank_id}>
                                                <TableCell>{bank.bank_name}</TableCell>
                                                <TableCell className="text-right">{bank.count}</TableCell>
                                                <TableCell className="text-right text-green-600">{formatCurrency(bank.total_amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {cashOutByBank.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Kas Keluar per Bank</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bank</TableHead>
                                            <TableHead className="text-right">Jumlah</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cashOutByBank.map((bank) => (
                                            <TableRow key={bank.bank_id}>
                                                <TableCell>{bank.bank_name}</TableCell>
                                                <TableCell className="text-right">{bank.count}</TableCell>
                                                <TableCell className="text-right text-red-600">{formatCurrency(bank.total_amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-4">
                {cashInByAccount.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Kas Masuk per Akun</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kode</TableHead>
                                            <TableHead>Nama Akun</TableHead>
                                            <TableHead className="text-right">Jumlah</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cashInByAccount.map((account) => (
                                            <TableRow key={account.account_id}>
                                                <TableCell className="font-mono">{account.account_code}</TableCell>
                                                <TableCell>{account.account_name}</TableCell>
                                                <TableCell className="text-right">{account.count}</TableCell>
                                                <TableCell className="text-right text-green-600">{formatCurrency(account.total_amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {cashOutByAccount.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Kas Keluar per Akun</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kode</TableHead>
                                            <TableHead>Nama Akun</TableHead>
                                            <TableHead className="text-right">Jumlah</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cashOutByAccount.map((account) => (
                                            <TableRow key={account.account_id}>
                                                <TableCell className="font-mono">{account.account_code}</TableCell>
                                                <TableCell>{account.account_name}</TableCell>
                                                <TableCell className="text-right">{account.count}</TableCell>
                                                <TableCell className="text-right text-red-600">{formatCurrency(account.total_amount)}</TableCell>
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
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Kas Masuk</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No.</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Bank</TableHead>
                                        <TableHead>Akun</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cashIns.length > 0 ? (
                                        cashIns.map((cashIn) => (
                                            <TableRow key={cashIn.id}>
                                                <TableCell className="font-mono">{cashIn.cash_in_number}</TableCell>
                                                <TableCell>{format(new Date(cashIn.cash_in_date), 'dd MMM yyyy')}</TableCell>
                                                <TableCell>{cashIn.bank_name}</TableCell>
                                                <TableCell>{cashIn.account_name}</TableCell>
                                                <TableCell className="text-right text-green-600 font-semibold">{formatCurrency(cashIn.amount)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                Tidak ada data kas masuk
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {cashIns.length > 0 && (
                                        <TableRow className="font-semibold bg-muted/50">
                                            <TableCell colSpan={4}>Total</TableCell>
                                            <TableCell className="text-right text-green-600">{formatCurrency(summary.total_cash_in_amount)}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detail Kas Keluar</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No.</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Bank</TableHead>
                                        <TableHead>Akun</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cashOuts.length > 0 ? (
                                        cashOuts.map((cashOut) => (
                                            <TableRow key={cashOut.id}>
                                                <TableCell className="font-mono">{cashOut.cash_out_number}</TableCell>
                                                <TableCell>{format(new Date(cashOut.cash_out_date), 'dd MMM yyyy')}</TableCell>
                                                <TableCell>{cashOut.bank_name}</TableCell>
                                                <TableCell>{cashOut.account_name}</TableCell>
                                                <TableCell className="text-right text-red-600 font-semibold">{formatCurrency(cashOut.amount)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                Tidak ada data kas keluar
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {cashOuts.length > 0 && (
                                        <TableRow className="font-semibold bg-muted/50">
                                            <TableCell colSpan={4}>Total</TableCell>
                                            <TableCell className="text-right text-red-600">{formatCurrency(summary.total_cash_out_amount)}</TableCell>
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

