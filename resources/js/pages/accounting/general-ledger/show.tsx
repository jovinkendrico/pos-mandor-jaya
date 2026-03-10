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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { index } from '@/routes/general-ledger';
import { ChartOfAccount, LedgerData, Vehicle } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Search } from 'lucide-react';
import { useState } from 'react';



interface PageProps {
    account: ChartOfAccount;
    dateFrom: string;
    dateTo: string;
    vehicleId?: string;
    ledgerData: LedgerData;
    groupedLedgerData?: LedgerData[];
    vehicles: Vehicle[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Buku Besar', href: '/general-ledger' },
    { title: 'Detail Buku Besar', href: '#' },
];

export default function GeneralLedgerShow({
    account,
    dateFrom,
    dateTo,
    vehicleId,
    ledgerData,
    groupedLedgerData = [],
    vehicles,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
        vehicle_id: vehicleId || '',
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
            <div className="mb-4 flex items-center justify-between">
                <div className="flex flex-row items-center gap-2">
                    <Link href={index().url}>
                        <ArrowLeft className="h-8 w-8" />
                    </Link>
                    <PageTitle
                        title={`Buku Besar - ${account.code} - ${account.name}`}
                    />
                </div>
            </div>

            <Card className="content mb-4">
                <CardHeader>
                    <CardTitle>Filter Periode</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="vehicle_id">Divisi / Truk</Label>
                            <Select
                                value={filters.vehicle_id}
                                onValueChange={(value) =>
                                    setFilters({
                                        ...filters,
                                        vehicle_id: value === 'all' ? '' : value,
                                    })
                                }
                            >
                                <SelectTrigger className="input-box">
                                    <SelectValue placeholder="Semua Divisi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Divisi</SelectItem>
                                    {vehicles.map((vehicle) => (
                                        <SelectItem
                                            key={vehicle.id}
                                            value={vehicle.id.toString()}
                                        >
                                            {vehicle.police_number} {vehicle.name ? `- ${vehicle.name}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

            <Card className="content mb-4">
                <CardHeader>
                    <CardTitle>Informasi Akun</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Kode Akun
                            </p>
                            <p className="font-medium">
                                {ledgerData.account.code}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Nama Akun
                            </p>
                            <p className="font-medium">
                                {ledgerData.account.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Saldo Awal
                            </p>
                            <p className="font-medium">
                                {formatCurrency(ledgerData.opening_balance)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Saldo Akhir
                            </p>
                            <p className="font-medium">
                                {formatCurrency(ledgerData.closing_balance)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {groupedLedgerData.length > 0 ? (
                groupedLedgerData.map((data, gIndex) => (
                    <Card key={gIndex} className="content mt-4">
                        <CardHeader>
                            <CardTitle>
                                {data.vehicle
                                    ? `Divisi: ${data.vehicle.police_number}`
                                    : 'Tanpa Divisi'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="input-box overflow-x-auto rounded-lg">
                                <Table className="content">
                                    <TableHeader>
                                        <TableRow className="dark:border-b-2 dark:border-white/25">
                                            <TableHead className="text-center">Tanggal</TableHead>
                                            <TableHead className="text-center">No. Jurnal</TableHead>
                                            <TableHead className="text-center">Divisi/Truk</TableHead>
                                            <TableHead className="text-center">Keterangan</TableHead>
                                            <TableHead className="text-right">Debit</TableHead>
                                            <TableHead className="text-right">Kredit</TableHead>
                                            <TableHead className="text-right">Saldo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                            <TableCell colSpan={4} className="font-medium">Saldo Awal</TableCell>
                                            <TableCell colSpan={2}></TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(data.opening_balance)}
                                            </TableCell>
                                        </TableRow>

                                        {(data.transactions || []).length > 0 ? (
                                            (data.transactions || []).map((transaction, tIndex) => (
                                                <TableRow key={tIndex} className="dark:border-b-2 dark:border-white/25">
                                                    <TableCell className="text-center">
                                                        {format(new Date(transaction.date), 'dd MMM yyyy')}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {transaction.journal_number}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {transaction.vehicle}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {transaction.description}
                                                    </TableCell>
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
                                                <TableCell colSpan={7} className="text-center text-muted-foreground">
                                                    Tidak ada transaksi pada periode ini
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        <TableRow className="bg-muted/50 font-semibold dark:bg-primary-800/10">
                                            <TableCell colSpan={4}>Total</TableCell>
                                            <TableCell className="text-right">{formatCurrency(data.debit_total)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(data.credit_total)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(data.closing_balance)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Card className="content mt-4">
                    <CardHeader>
                        <CardTitle>Transaksi</CardTitle>
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
                                        <TableHead className="text-center">Tanggal</TableHead>
                                        <TableHead className="text-center">No. Jurnal</TableHead>
                                        <TableHead className="text-center">Divisi/Truk</TableHead>
                                        <TableHead className="text-center">Keterangan</TableHead>
                                        <TableHead className="text-right">Debit</TableHead>
                                        <TableHead className="text-right">Kredit</TableHead>
                                        <TableHead className="text-right">Saldo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                        <TableCell colSpan={4} className="font-medium">Saldo Awal</TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(ledgerData.opening_balance)}
                                        </TableCell>
                                    </TableRow>

                                    {(ledgerData.transactions || []).length > 0 ? (
                                        (ledgerData.transactions || []).map((transaction, tIndex) => (
                                            <TableRow key={tIndex} className="dark:border-b-2 dark:border-white/25">
                                                <TableCell className="text-center">
                                                    {format(new Date(transaction.date), 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {transaction.journal_number}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {transaction.vehicle}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {transaction.description}
                                                </TableCell>
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
                                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                                Tidak ada transaksi pada periode ini
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    <TableRow className="bg-muted/50 font-semibold dark:bg-primary-800/10">
                                        <TableCell colSpan={4}>Total</TableCell>
                                        <TableCell className="text-right">{formatCurrency(ledgerData.debit_total)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(ledgerData.credit_total)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(ledgerData.closing_balance)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </AppLayout>
    );
}
