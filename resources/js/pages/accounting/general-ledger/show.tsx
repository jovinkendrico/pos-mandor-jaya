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
import { Search, ArrowLeft } from 'lucide-react';
import { ChartOfAccount } from '@/types';
import { Link } from '@inertiajs/react';

interface Transaction {
    date: string;
    journal_number: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

interface LedgerData {
    account: ChartOfAccount;
    opening_balance: number;
    transactions: Transaction[];
    debit_total: number;
    credit_total: number;
    closing_balance: number;
}

interface PageProps {
    account: ChartOfAccount;
    dateFrom: string;
    dateTo: string;
    ledgerData: LedgerData;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Buku Besar', href: '/general-ledger' },
    { title: 'Detail Buku Besar', href: '#' },
];

export default function GeneralLedgerShow({ account, dateFrom, dateTo, ledgerData }: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
    });

    const handleFilter = () => {
        router.get(`/general-ledger/${account.id}`, filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Buku Besar - ${account.name}`} />
            <div className="flex justify-between items-center mb-4">
                <div>
                    <Link href="/general-ledger">
                        <Button variant="outline" size="sm" className="mb-2">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Kembali
                        </Button>
                    </Link>
                    <PageTitle title={`Buku Besar - ${account.code} - ${account.name}`} />
                </div>
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

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Informasi Akun</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Kode Akun</p>
                            <p className="font-medium">{ledgerData.account.code}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Nama Akun</p>
                            <p className="font-medium">{ledgerData.account.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Saldo Awal</p>
                            <p className="font-medium">{formatCurrency(ledgerData.opening_balance)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Saldo Akhir</p>
                            <p className="font-medium">{formatCurrency(ledgerData.closing_balance)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaksi</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} -{' '}
                        {format(new Date(dateTo), 'dd MMM yyyy')}
                    </p>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>No. Jurnal</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Kredit</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Opening Balance Row */}
                            <TableRow className="bg-muted/50">
                                <TableCell colSpan={3} className="font-medium">
                                    Saldo Awal
                                </TableCell>
                                <TableCell colSpan={2}></TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(ledgerData.opening_balance)}
                                </TableCell>
                            </TableRow>

                            {/* Transactions */}
                            {ledgerData.transactions.length > 0 ? (
                                ledgerData.transactions.map((transaction, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {format(new Date(transaction.date), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell>{transaction.journal_number}</TableCell>
                                        <TableCell>{transaction.description}</TableCell>
                                        <TableCell className="text-right">
                                            {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(transaction.balance)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        Tidak ada transaksi pada periode ini
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* Totals Row */}
                            <TableRow className="bg-muted/50 font-semibold">
                                <TableCell colSpan={3}>Total</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(ledgerData.debit_total)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(ledgerData.credit_total)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(ledgerData.closing_balance)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

