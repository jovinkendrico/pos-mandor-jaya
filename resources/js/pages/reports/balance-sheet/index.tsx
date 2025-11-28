import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';

interface AccountDetail {
    code: string;
    name: string;
    balance: number;
}

interface PageProps {
    asOfDate: string;
    assetDetails: AccountDetail[];
    liabilityDetails: AccountDetail[];
    equityDetails: AccountDetail[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
    netProfit: number;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Neraca', href: '#' },
];

export default function BalanceSheetIndex({
    asOfDate,
    assetDetails,
    liabilityDetails,
    equityDetails,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity,
    netProfit,
}: PageProps) {
    const balanceSheetRoute = () => ({ url: '/reports/balance-sheet' });

    const { allFilters, handleFilterChange } = useResourceFilters(
        balanceSheetRoute,
        {
            search: '',
            status: 'all',
            date_from: '',
            date_to: '',
            sort_by: 'created_at',
            sort_order: 'desc',
            as_of_date: asOfDate,
        },
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Neraca" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Neraca" />
            </div>

            <FilterBar
                filters={allFilters}
                onFilterChange={handleFilterChange}
                showDateRange={false}
                showAsOfDate={true}
                showSearch={false}
                showStatus={false}
                showPaymentStatus={false}
                showSort={false}
            />
            <div className="flex w-full justify-end">
                <Button
                    onClick={() => {
                        const params = new URLSearchParams();
                        if (allFilters.as_of_date) {
                            params.append('as_of_date', allFilters.as_of_date);
                        }
                        window.open(
                            `/reports/balance-sheet/print?${params.toString()}`,
                            '_blank',
                        );
                    }}
                    variant="outline"
                    className="btn-primary"
                >
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak PDF
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="mb-4 grid gap-4 md:grid-cols-4">
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Aktiva
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalAssets)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Aset
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Kewajiban
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalLiabilities)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Pasiva
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Ekuitas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalEquity)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Modal
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pasiva + Ekuitas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalLiabilitiesAndEquity)}
                        </div>
                        <p
                            className={`mt-1 text-xs ${Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01 ? 'text-green-600' : 'text-red-600'}`}
                        >
                            {Math.abs(totalAssets - totalLiabilitiesAndEquity) <
                            0.01
                                ? '✓ Seimbang'
                                : '✗ Tidak seimbang'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Balance Sheet Table */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Assets */}
                <Card className="content">
                    <CardHeader>
                        <CardTitle>Aktiva (Aset)</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Per Tanggal:{' '}
                            {format(new Date(asOfDate), 'dd MMM yyyy')}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center">
                                            Kode
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Nama Akun
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Saldo
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assetDetails.length > 0 ? (
                                        assetDetails.map((account, index) => (
                                            <TableRow
                                                key={index}
                                                className="dark:border-b-2 dark:border-white/25"
                                            >
                                                <TableCell className="text-center font-mono">
                                                    {account.code}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {account.name}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(
                                                        account.balance,
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
                                                Tidak ada data aktiva
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow className="bg-muted/50 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                        <TableCell colSpan={2}>
                                            Total Aktiva
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(totalAssets)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Liabilities and Equity */}
                <Card className="content">
                    <CardHeader>
                        <CardTitle>Pasiva (Kewajiban + Ekuitas)</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Per Tanggal:{' '}
                            {format(new Date(asOfDate), 'dd MMM yyyy')}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center">
                                            Kode
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Nama Akun
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Saldo
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Liabilities */}
                                    {liabilityDetails.length > 0 && (
                                        <>
                                            {liabilityDetails.map(
                                                (account, index) => (
                                                    <TableRow
                                                        key={`liability-${index}`}
                                                        className="dark:border-b-2 dark:border-white/25"
                                                    >
                                                        <TableCell className="text-center font-mono">
                                                            {account.code}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {account.name}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(
                                                                account.balance,
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                            <TableRow className="bg-muted/30 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                                <TableCell colSpan={2}>
                                                    Total Kewajiban
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(
                                                        totalLiabilities,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    )}

                                    {/* Equity */}
                                    {equityDetails.length > 0 && (
                                        <>
                                            {equityDetails.map(
                                                (account, index) => (
                                                    <TableRow
                                                        key={`equity-${index}`}
                                                        className="dark:border-b-2 dark:border-white/25"
                                                    >
                                                        <TableCell className="text-center font-mono">
                                                            {account.code}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {account.name}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(
                                                                account.balance,
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                            <TableRow className="bg-muted/30 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                                <TableCell colSpan={2}>
                                                    Total Ekuitas
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(
                                                        totalEquity,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    )}

                                    {liabilityDetails.length === 0 &&
                                        equityDetails.length === 0 && (
                                            <TableRow className="dark:border-b-2 dark:border-white/25">
                                                <TableCell
                                                    colSpan={3}
                                                    className="text-center text-muted-foreground"
                                                >
                                                    Tidak ada data pasiva
                                                </TableCell>
                                            </TableRow>
                                        )}

                                    <TableRow className="bg-muted/30 font-semibold dark:border-b-2 dark:border-white/25 dark:bg-primary-800/10">
                                        <TableCell colSpan={2}>
                                            Total Pasiva + Ekuitas
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(
                                                totalLiabilitiesAndEquity,
                                            )}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
