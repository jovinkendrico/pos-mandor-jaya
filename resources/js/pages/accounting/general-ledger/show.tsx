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
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { index } from '@/routes/general-ledger';
import { ChartOfAccount, LedgerData, Vehicle, Bank } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

interface PageProps {
    account: ChartOfAccount;
    dateFrom: string;
    dateTo: string;
    vehicleId?: string;
    bankId?: string;
    ledgerData: LedgerData;
    groupedLedgerData?: (LedgerData & { bank?: { id: number, name: string }, vehicle?: { id: number, police_number: string } })[];
    vehicles: Vehicle[];
    banks: Bank[];
    startFromZero: boolean;
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
    bankId,
    ledgerData,
    groupedLedgerData = [],
    vehicles,
    banks,
    startFromZero,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
        vehicle_id: vehicleId || '',
        bank_id: bankId || '',
        start_from_zero: startFromZero,
    });

    const handleFilter = () => {
        router.get(`/general-ledger/${account.id}`, filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Group groupedLedgerData by Bank for hierarchical display
    const nestedData = useMemo(() => {
        const result: { [key: string]: { bankInfo: any, vehicleData: any[] } } = {};
        
        groupedLedgerData.forEach(item => {
            const bankId = item.bank?.id || 0;
            const bankName = item.bank?.name || 'Tanpa Kas';
            
            if (!result[bankId]) {
                result[bankId] = {
                    bankInfo: { id: bankId, name: bankName },
                    vehicleData: []
                };
            }
            result[bankId].vehicleData.push(item);
        });
        
        return Object.values(result);
    }, [groupedLedgerData]);

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
                <Button 
                    className="btn-primary"
                    onClick={() => window.open(`/general-ledger/${account.id}/print?date_from=${dateFrom}&date_to=${dateTo}&vehicle_id=${vehicleId || ''}&bank_id=${filters.bank_id || ''}&start_from_zero=${filters.start_from_zero ? 1 : 0}`, '_blank')}
                >
                    Cetak PDF
                </Button>
            </div>

            <Card className="content mb-4">
                <CardHeader>
                    <CardTitle>Filter Periode & Kategori</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
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
                                value={filters.vehicle_id || 'all'}
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
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="bank_id">Kas / Bank</Label>
                            <Select
                                value={filters.bank_id || 'all'}
                                onValueChange={(value) =>
                                    setFilters({
                                        ...filters,
                                        bank_id: value === 'all' ? '' : value,
                                    })
                                }
                            >
                                <SelectTrigger className="input-box">
                                    <SelectValue placeholder="Semua Kas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kas</SelectItem>
                                    {banks.map((bank) => (
                                        <SelectItem
                                            key={bank.id}
                                            value={bank.id.toString()}
                                        >
                                            {bank.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Checkbox 
                                id="start_from_zero" 
                                checked={filters.start_from_zero}
                                onCheckedChange={(checked) => 
                                    setFilters({ ...filters, start_from_zero: !!checked })
                                }
                            />
                            <Label htmlFor="start_from_zero" className="cursor-pointer">Mulai dari Nol (0)</Label>
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={handleFilter}
                                className="btn-primary w-full"
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
                    <CardTitle>Ringkasan Akun</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Saldo Awal</p>
                            <p className="font-medium text-lg">{formatCurrency(ledgerData.opening_balance)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Debit</p>
                            <p className="font-medium text-lg text-green-600">{formatCurrency(ledgerData.debit_total)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Kredit</p>
                            <p className="font-medium text-lg text-red-600">{formatCurrency(ledgerData.credit_total)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Saldo Akhir</p>
                            <p className="font-medium text-lg">{formatCurrency(ledgerData.closing_balance)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {nestedData.length > 0 ? (
                nestedData.map((bankGroup, bIndex) => (
                    <div key={bIndex} className="mt-8">
                        <div className="mb-4 bg-primary-100 p-3 rounded-lg dark:bg-primary-900/30">
                            <h2 className="text-xl font-bold text-primary-800 dark:text-primary-200 uppercase tracking-wider">
                                {bankGroup.bankInfo.name}
                            </h2>
                        </div>
                        
                        <div className="space-y-6 ml-4 border-l-4 border-primary-200 dark:border-primary-800 pl-4">
                            {bankGroup.vehicleData.map((data, vIndex) => (
                                <Card key={vIndex} className="content">
                                    {data.vehicle?.police_number && data.vehicle.police_number !== 'None' && (
                                        <CardHeader className="py-3 px-4 bg-muted/30">
                                            <CardTitle className="text-lg">
                                                Divisi: {data.vehicle.police_number}
                                            </CardTitle>
                                        </CardHeader>
                                    )}
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table className="content">
                                                <TableHeader>
                                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                                        <TableHead className="text-center w-[100px]">Tanggal</TableHead>
                                                        <TableHead className="text-center w-[150px]">No. Jurnal</TableHead>
                                                        <TableHead className="text-center">Keterangan</TableHead>
                                                        <TableHead className="text-right w-[140px]">Debit</TableHead>
                                                        <TableHead className="text-right w-[140px]">Kredit</TableHead>
                                                        <TableHead className="text-right w-[150px]">Saldo</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow className="bg-muted/50 font-semibold dark:bg-primary-800/10">
                                                        <TableCell colSpan={3} className="font-medium">SALDO AWAL</TableCell>
                                                        <TableCell colSpan={2}></TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {formatCurrency(data.opening_balance)}
                                                        </TableCell>
                                                    </TableRow>

                                                    {(data.transactions || []).length > 0 ? (
                                                        (data.transactions || []).map((transaction, tIndex) => (
                                                            <TableRow key={tIndex} className="dark:border-b-2 dark:border-white/25">
                                                                <TableCell className="text-center whitespace-nowrap">
                                                                    {format(new Date(transaction.date), 'dd/MM/yy')}
                                                                </TableCell>
                                                                <TableCell className="text-center font-mono text-xs">
                                                                    {transaction.journal_number}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="max-w-[400px] break-words">
                                                                        {transaction.description}
                                                                    </div>
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
                                                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                                                Tidak ada transaksi pada periode ini
                                                            </TableCell>
                                                        </TableRow>
                                                    )}

                                                    <TableRow className="bg-muted/50 font-bold dark:bg-primary-800/10">
                                                        <TableCell colSpan={3}>TOTAL</TableCell>
                                                        <TableCell className="text-right text-green-600">{formatCurrency(data.debit_total)}</TableCell>
                                                        <TableCell className="text-right text-red-600">{formatCurrency(data.credit_total)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(data.closing_balance)}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <Card className="content mt-6">
                    <CardHeader>
                        <CardTitle>Detail Transaksi</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
                        </p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center w-[100px]">Tanggal</TableHead>
                                        <TableHead className="text-center w-[150px]">No. Jurnal</TableHead>
                                        <TableHead className="text-center">Keterangan</TableHead>
                                        <TableHead className="text-right w-[140px]">Debit</TableHead>
                                        <TableHead className="text-right w-[140px]">Kredit</TableHead>
                                        <TableHead className="text-right w-[150px]">Saldo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="bg-muted/50 font-semibold dark:bg-primary-800/10">
                                        <TableCell colSpan={3} className="font-medium">SALDO AWAL</TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(ledgerData.opening_balance)}
                                        </TableCell>
                                    </TableRow>

                                    {(ledgerData.transactions || []).length > 0 ? (
                                        (ledgerData.transactions || []).map((transaction, tIndex) => (
                                            <TableRow key={tIndex} className="dark:border-b-2 dark:border-white/25">
                                                <TableCell className="text-center whitespace-nowrap">
                                                    {format(new Date(transaction.date), 'dd/MM/yy')}
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-xs">
                                                    {transaction.journal_number}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-[400px] break-words">
                                                        {transaction.description}
                                                    </div>
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
                                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                                Tidak ada transaksi pada periode ini
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    <TableRow className="bg-muted/50 font-bold dark:bg-primary-800/10">
                                        <TableCell colSpan={3}>TOTAL</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(ledgerData.debit_total)}</TableCell>
                                        <TableCell className="text-right text-red-600">{formatCurrency(ledgerData.credit_total)}</TableCell>
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
