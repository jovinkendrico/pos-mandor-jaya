import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { show as glShow } from '@/routes/general-ledger';
import { LedgerData, Vehicle, Bank } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { Info, Printer } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    dateFrom: string;
    dateTo: string;
    vehicleId?: string;
    bankId?: string;
    vehicles: Vehicle[];
    banks: Bank[];
    ledgerData: LedgerData[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports' },
    { title: 'Laporan Pendapatan', href: '#' },
];

const indexRoute = () => ({ url: '/reports/income' });

export default function IncomeReportIndex({
    dateFrom,
    dateTo,
    vehicleId,
    bankId,
    vehicles,
    banks,
    ledgerData,
}: PageProps) {
    const [defaultFilters] = useState({
        search: '',
        date_from: dateFrom,
        date_to: dateTo,
        vehicle_id: vehicleId || '',
        bank_id: bankId || '',
        status: 'all',
        sort_by: 'date',
        sort_order: 'desc',
    });

    const { allFilters, handleFilterChange } = useResourceFilters(
        indexRoute,
        defaultFilters,
    );

    const handlePrint = () => {
        const queryParams = new URLSearchParams({
            date_from: allFilters.date_from || dateFrom,
            date_to: allFilters.date_to || dateTo,
            vehicle_id: allFilters.vehicle_id || '',
            bank_id: allFilters.bank_id || '',
        }).toString();
        
        window.open(`/reports/income/print?${queryParams}`, '_blank');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Pendapatan" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Pendapatan" />
                <Button 
                    className="btn-primary"
                    onClick={handlePrint}
                >
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Laporan (PDF)
                </Button>
            </div>

            <FilterBar
                filters={{
                    ...allFilters,
                    date_from: allFilters.date_from ?? '',
                    date_to: allFilters.date_to ?? '',
                }}
                onFilterChange={handleFilterChange}
                defaultFilters={defaultFilters}
                showPaymentStatus={false}
                showStatus={false}
                showSearch={false}
                showDateRange={true}
                showSort={false}
                additionalFilters={
                    <div className="flex gap-4">
                        <div className="w-[200px]">
                            <Label htmlFor="bank_id">Kas / Bank</Label>
                            <Select
                                value={allFilters.bank_id || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange({
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
                        <div className="w-[200px]">
                            <Label htmlFor="vehicle_id">Divisi / Truk</Label>
                            <Select
                                value={allFilters.vehicle_id || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange({
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
                                            {vehicle.police_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                }
            />
            
            <div className="mb-4"></div>
            
            <Card className="content">
                <CardHeader>
                    <CardTitle>Rincian Pendapatan per Akun</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(allFilters.date_from || dateFrom), 'dd MMM yyyy')} -{' '}
                        {format(new Date(allFilters.date_to || dateTo), 'dd MMM yyyy')}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="input-box overflow-x-auto rounded-lg">
                        <TableLayout
                            tableColumn={[
                                'Kode',
                                'Nama Akun Pendapatan',
                                'Saldo Awal',
                                'Debit',
                                'Kredit (Pemasukan)',
                                'Saldo Akhir',
                                'Detail',
                            ]}
                            tableRow={ledgerData}
                            renderRow={(item) => (
                                <>
                                    <TableCell className="flex w-full min-w-[100px] items-center justify-center text-center">
                                        {item.account.code}
                                    </TableCell>
                                    <TableCell className="flex w-full min-w-[200px] items-center justify-start text-left font-medium">
                                        {item.account.name}
                                    </TableCell>
                                    <TableCell className="flex w-full min-w-[120px] items-center justify-end text-right">
                                        {formatCurrency(item.opening_balance)}
                                    </TableCell>
                                    <TableCell className="flex w-full min-w-[120px] items-center justify-end text-right">
                                        {formatCurrency(item.debit_total)}
                                    </TableCell>
                                    <TableCell className="flex w-full min-w-[120px] items-center justify-end text-right text-green-600">
                                        {formatCurrency(item.credit_total)}
                                    </TableCell>
                                    <TableCell className="flex w-full min-w-[120px] items-center justify-end text-right font-bold">
                                        {formatCurrency(item.closing_balance)}
                                    </TableCell>
                                    <TableCell className="flex w-full min-w-[80px] items-center justify-center text-center">
                                        <Link href={glShow(item.account.id).url}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="btn-info"
                                            >
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
