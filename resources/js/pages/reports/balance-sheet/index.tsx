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
import { Search, Printer } from 'lucide-react';

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
    const [filters, setFilters] = useState({
        as_of_date: asOfDate,
    });

    const handleFilter = () => {
        router.get('/reports/balance-sheet', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Neraca" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Neraca" />
            </div>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Filter Tanggal</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="as_of_date">Per Tanggal</Label>
                            <DatePicker
                                value={filters.as_of_date ? new Date(filters.as_of_date) : undefined}
                                onChange={(date) =>
                                    setFilters({
                                        ...filters,
                                        as_of_date: date ? format(date, 'yyyy-MM-dd') : '',
                                    })
                                }
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={handleFilter} className="flex-1">
                                <Search className="mr-2 h-4 w-4" />
                                Tampilkan
                            </Button>
                            <Button
                                onClick={() => {
                                    const params = new URLSearchParams({
                                        as_of_date: filters.as_of_date,
                                    });
                                    window.open(`/reports/balance-sheet/print?${params.toString()}`, '_blank');
                                }}
                                variant="outline"
                                className="flex-1"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Cetak PDF
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Aktiva</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalAssets)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Aset</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Kewajiban</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalLiabilities)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Pasiva</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Ekuitas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalEquity)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Modal</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pasiva + Ekuitas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalLiabilitiesAndEquity)}</div>
                        <p className={`text-xs mt-1 ${Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01 ? '✓ Seimbang' : '✗ Tidak seimbang'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Balance Sheet Table */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Assets */}
                <Card>
                    <CardHeader>
                        <CardTitle>Aktiva (Aset)</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Per Tanggal: {format(new Date(asOfDate), 'dd MMM yyyy')}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama Akun</TableHead>
                                        <TableHead className="text-right">Saldo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assetDetails.length > 0 ? (
                                        assetDetails.map((account, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-mono">{account.code}</TableCell>
                                                <TableCell>{account.name}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                Tidak ada data aktiva
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow className="font-semibold bg-muted/50">
                                        <TableCell colSpan={2}>Total Aktiva</TableCell>
                                        <TableCell className="text-right">{formatCurrency(totalAssets)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Liabilities and Equity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pasiva (Kewajiban + Ekuitas)</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Per Tanggal: {format(new Date(asOfDate), 'dd MMM yyyy')}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama Akun</TableHead>
                                        <TableHead className="text-right">Saldo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Liabilities */}
                                    {liabilityDetails.length > 0 && (
                                        <>
                                            {liabilityDetails.map((account, index) => (
                                                <TableRow key={`liability-${index}`}>
                                                    <TableCell className="font-mono">{account.code}</TableCell>
                                                    <TableCell>{account.name}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="font-semibold bg-muted/30">
                                                <TableCell colSpan={2}>Total Kewajiban</TableCell>
                                                <TableCell className="text-right">{formatCurrency(totalLiabilities)}</TableCell>
                                            </TableRow>
                                        </>
                                    )}

                                    {/* Equity */}
                                    {equityDetails.length > 0 && (
                                        <>
                                            {equityDetails.map((account, index) => (
                                                <TableRow key={`equity-${index}`}>
                                                    <TableCell className="font-mono">{account.code}</TableCell>
                                                    <TableCell>{account.name}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="font-semibold bg-muted/30">
                                                <TableCell colSpan={2}>Total Ekuitas</TableCell>
                                                <TableCell className="text-right">{formatCurrency(totalEquity)}</TableCell>
                                            </TableRow>
                                        </>
                                    )}

                                    {liabilityDetails.length === 0 && equityDetails.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                Tidak ada data pasiva
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    <TableRow className="font-semibold bg-muted/50">
                                        <TableCell colSpan={2}>Total Pasiva + Ekuitas</TableCell>
                                        <TableCell className="text-right">{formatCurrency(totalLiabilitiesAndEquity)}</TableCell>
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

