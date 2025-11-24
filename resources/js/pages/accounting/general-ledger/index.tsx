import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { DatePicker } from '@/components/date-picker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { ChartOfAccount } from '@/types';

interface LedgerData {
    account: ChartOfAccount;
    opening_balance: number;
    debit_total: number;
    credit_total: number;
    closing_balance: number;
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    accountId?: string;
    accounts: ChartOfAccount[];
    ledgerData: LedgerData[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Buku Besar', href: '#' },
];

export default function GeneralLedgerIndex({
    dateFrom,
    dateTo,
    accountId,
    accounts,
    ledgerData,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
        account_id: accountId || '',
    });

    const handleFilter = () => {
        router.get('/general-ledger', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buku Besar" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Buku Besar" />
            </div>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <div className="space-y-2">
                            <Label htmlFor="account_id">Akun (Opsional)</Label>
                            <Select
                                value={filters.account_id || undefined}
                                onValueChange={(value) =>
                                    setFilters({ ...filters, account_id: value || '' })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Akun" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.code} - {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

            <Card>
                <CardHeader>
                    <CardTitle>Buku Besar</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} -{' '}
                        {format(new Date(dateTo), 'dd MMM yyyy')}
                    </p>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama Akun</TableHead>
                                <TableHead className="text-right">Saldo Awal</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Kredit</TableHead>
                                <TableHead className="text-right">Saldo Akhir</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ledgerData.length > 0 ? (
                                ledgerData.map((item) => (
                                    <TableRow key={item.account.id}>
                                        <TableCell>{item.account.code}</TableCell>
                                        <TableCell>{item.account.name}</TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(item.opening_balance)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(item.debit_total)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(item.credit_total)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(item.closing_balance)}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/general-ledger/${item.account.id}?date_from=${filters.date_from}&date_to=${filters.date_to}`}
                                            >
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Detail
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        Tidak ada data
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

