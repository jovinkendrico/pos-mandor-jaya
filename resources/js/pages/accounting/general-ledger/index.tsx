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
import { show } from '@/routes/general-ledger';
import { ChartOfAccount } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { Info } from 'lucide-react';
import { useState } from 'react';

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

const indexRoute = () => ({ url: '/general-ledger' });

export default function GeneralLedgerIndex({
    dateFrom,
    dateTo,
    accountId,
    accounts,
    ledgerData,
}: PageProps) {
    const [defaultFilters] = useState({
        search: '',
        date_from: dateFrom,
        date_to: dateTo,
        account_id: accountId || '',
        status: 'all',
        sort_by: 'date',
        sort_order: 'desc',
    });

    const { allFilters, handleFilterChange } = useResourceFilters(
        indexRoute,
        defaultFilters,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buku Besar" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Buku Besar" />
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
                    <div className="w-[200px]">
                        <Label htmlFor="account_id">Akun (Opsional)</Label>
                        <Select
                            value={allFilters.account_id || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange({
                                    account_id: value === 'all' ? '' : value,
                                })
                            }
                        >
                            <SelectTrigger className="combobox">
                                <SelectValue placeholder="Semua Akun" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Akun</SelectItem>
                                {accounts.map((account) => (
                                    <SelectItem
                                        key={account.id}
                                        value={account.id.toString()}
                                    >
                                        {account.code} - {account.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                }
            />
            <div className="mb-4"></div>
            <Card className="content">
                <CardHeader>
                    <CardTitle>Buku Besar</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} -{' '}
                        {format(new Date(dateTo), 'dd MMM yyyy')}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="input-box overflow-x-auto rounded-lg">
                        <TableLayout
                            tableColumn={[
                                'Kode',
                                'Nama Akun',
                                'Saldo Awal',
                                'Debit',
                                'Kredit',
                                'Saldo Akhir',
                                'Aksi',
                            ]}
                            tableRow={ledgerData}
                            renderRow={(item) => (
                                <>
                                    <TableCell className="flex w-full min-w-[105px] items-center justify-center text-center">
                                        {item.account.code}
                                    </TableCell>
                                    <TableCell className="flex w-full min-w-[105px] items-center justify-center text-center">
                                        {item.account.name}
                                    </TableCell>
                                    <TableCell className="flex w-full min-w-[105px] items-center justify-center text-center">
                                        {formatCurrency(item.opening_balance)}
                                    </TableCell>
                                    <TableCell className="flex w-full min-w-[105px] items-center justify-center text-center">
                                        {formatCurrency(item.debit_total)}
                                    </TableCell>
                                    <TableCell className="flex w-full min-w-[105px] items-center justify-center text-center">
                                        {formatCurrency(item.credit_total)}
                                    </TableCell>
                                    <TableCell className="flex w-full min-w-[105px] items-center justify-center text-center">
                                        {formatCurrency(item.closing_balance)}
                                    </TableCell>
                                    <TableCell className="flex w-full min-w-[105px] items-center justify-center text-center">
                                        <Link href={show(item.account.id).url}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="btn-info"
                                            >
                                                <Info />
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
