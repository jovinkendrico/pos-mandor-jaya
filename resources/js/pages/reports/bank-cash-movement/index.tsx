import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/date-picker';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import React, { useState } from 'react';

interface Transaction {
    id: number;
    date: string;
    type: string;
    reference_number: string;
    description: string;
    debit: number;
    credit: number;
    balance_before: number;
    balance_after: number;
}

interface IBank {
    id: number;
    name: string;
    account_number: string;
}

interface Props {
    banks: IBank[];
    selectedBank: IBank | null;
    dateFrom: string;
    dateTo: string;
    transactions: Transaction[];
    openingBalance: number;
    closingBalance: number;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports' },
    { title: 'Pergerakan Kas Bank', href: '#' },
];

export default function BankCashMovementReport({
    banks,
    selectedBank,
    dateFrom,
    dateTo,
    transactions,
    openingBalance,
    closingBalance,
}: Props) {
    const [fromDate, setFromDate] = useState<Date | undefined>(
        dateFrom ? new Date(dateFrom) : undefined,
    );
    const [toDate, setToDate] = useState<Date | undefined>(
        dateTo ? new Date(dateTo) : undefined,
    );

    const [bankId, setBankId] = useState<string>(
        selectedBank ? selectedBank.id.toString() : '',
    );

    const handleFilter = () => {
        if (!bankId) return;

        router.get(
            '/reports/bank-cash-movement',
            {
                date_from: fromDate ? format(fromDate, 'yyyy-MM-dd') : '',
                date_to: toDate ? format(toDate, 'yyyy-MM-dd') : '',
                bank_id: bankId,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handlePrint = () => {
        if (!bankId) return;
        const qDateFrom = fromDate ? format(fromDate, 'yyyy-MM-dd') : '';
        const qDateTo = toDate ? format(toDate, 'yyyy-MM-dd') : '';
        window.open(
            `/reports/bank-cash-movement/print?bank_id=${bankId}&date_from=${qDateFrom}&date_to=${qDateTo}`,
            '_blank',
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Pergerakan Kas Bank" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <PageTitle title="Laporan Pergerakan Kas Bank" />
                <Button onClick={handlePrint} disabled={!selectedBank}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print PDF
                </Button>
            </div>

            <Card className="content p-4 mb-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="w-full md:w-[250px] space-y-2">
                        <Label>Pilih Bank/Kas</Label>
                        <Select value={bankId} onValueChange={setBankId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Bank/Kas" />
                            </SelectTrigger>
                            <SelectContent>
                                {banks.map((bank) => (
                                    <SelectItem
                                        key={bank.id}
                                        value={bank.id.toString()}
                                    >
                                        {bank.name}{' '}
                                        {bank.account_number
                                            ? `(${bank.account_number})`
                                            : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-[160px] space-y-2">
                        <Label>Dari Tanggal</Label>
                        <DatePicker
                            value={fromDate}
                            onChange={setFromDate}
                            className="bg-background"
                        />
                    </div>

                    <div className="w-[160px] space-y-2">
                        <Label>Sampai Tanggal</Label>
                        <DatePicker
                            value={toDate}
                            onChange={setToDate}
                            className="bg-background"
                        />
                    </div>

                    <Button onClick={handleFilter} disabled={!bankId}>
                        Tampilkan Data
                    </Button>
                </div>
            </Card>

            {selectedBank ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Card className="p-4 content text-center md:text-left border-l-4 border-l-blue-500">
                            <p className="text-sm font-medium text-muted-foreground">
                                Saldo Awal ({dateFrom})
                            </p>
                            <p className="text-2xl font-bold mt-1">
                                {formatCurrency(openingBalance)}
                            </p>
                        </Card>
                        <Card className="p-4 content text-center md:text-left border-l-4 border-l-green-500">
                            <p className="text-sm font-medium text-muted-foreground">
                                Saldo Akhir ({dateTo})
                            </p>
                            <p className="text-2xl font-bold mt-1">
                                {formatCurrency(closingBalance)}
                            </p>
                        </Card>
                    </div>

                    <Card className="content">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">Tanggal</TableHead>
                                        <TableHead className="text-center">No. Referensi</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead className="text-right">Debit</TableHead>
                                        <TableHead className="text-right">Kredit</TableHead>
                                        <TableHead className="text-right">Saldo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                Tidak ada data pergerakan kas pada periode ini.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <>
                                            {transactions.map((t) => (
                                                <TableRow key={t.id}>
                                                    <TableCell className="text-center">
                                                        {formatDate(new Date(t.date))}
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono text-sm">
                                                        {t.reference_number}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {t.description}
                                                    </TableCell>
                                                    <TableCell className="text-right text-green-600">
                                                        {t.debit > 0
                                                            ? formatCurrency(t.debit)
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right text-red-600">
                                                        {t.credit > 0
                                                            ? formatCurrency(t.credit)
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {formatCurrency(t.balance_after)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed text-muted-foreground bg-white dark:bg-zinc-950">
                    <p>Silakan pilih Bank/Kas dan tekan Tampilkan Data untuk memuat riwayat transaksi.</p>
                </div>
            )}
        </AppLayout>
    );
}
