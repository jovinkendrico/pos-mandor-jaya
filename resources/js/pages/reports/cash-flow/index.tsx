import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { DatePicker } from '@/components/date-picker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Search } from 'lucide-react';

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
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
    });

    const handleFilter = () => {
        router.get('/reports/cash-flow', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Arus Kas" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Arus Kas" />
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

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-5 mb-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Awal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_opening_balance)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Kas Masuk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_cash_in)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Kas Keluar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_cash_out)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary.total_net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(summary.total_net_flow)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_closing_balance)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Bank Cash Flow */}
            {bankCashFlow.length > 0 && (
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Arus Kas per Bank/Kas</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bank/Kas</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead className="text-right">Saldo Awal</TableHead>
                                        <TableHead className="text-right">Kas Masuk</TableHead>
                                        <TableHead className="text-right">Kas Keluar</TableHead>
                                        <TableHead className="text-right">Net Flow</TableHead>
                                        <TableHead className="text-right">Saldo Akhir</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bankCashFlow.map((bank) => (
                                        <TableRow key={bank.bank_id}>
                                            <TableCell className="font-medium">{bank.bank_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">{bank.bank_type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(bank.opening_balance)}</TableCell>
                                            <TableCell className="text-right text-green-600">{formatCurrency(bank.cash_in)}</TableCell>
                                            <TableCell className="text-right text-red-600">{formatCurrency(bank.cash_out)}</TableCell>
                                            <TableCell className={`text-right font-semibold ${bank.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(bank.net_cash_flow)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(bank.closing_balance)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="font-semibold bg-muted/50">
                                        <TableCell colSpan={2}>Total</TableCell>
                                        <TableCell className="text-right">{formatCurrency(summary.total_opening_balance)}</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(summary.total_cash_in)}</TableCell>
                                        <TableCell className="text-right text-red-600">{formatCurrency(summary.total_cash_out)}</TableCell>
                                        <TableCell className={`text-right ${summary.total_net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(summary.total_net_flow)}
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(summary.total_closing_balance)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Daily Cash Flow */}
            {dailyCashFlow.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Arus Kas Harian</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-right">Kas Masuk</TableHead>
                                        <TableHead className="text-right">Kas Keluar</TableHead>
                                        <TableHead className="text-right">Net Flow</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dailyCashFlow.map((day, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{day.date_formatted}</TableCell>
                                            <TableCell className="text-right text-green-600">{formatCurrency(day.cash_in)}</TableCell>
                                            <TableCell className="text-right text-red-600">{formatCurrency(day.cash_out)}</TableCell>
                                            <TableCell className={`text-right font-semibold ${day.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

