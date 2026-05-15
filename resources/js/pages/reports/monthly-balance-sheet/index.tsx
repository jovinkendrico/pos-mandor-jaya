import PageTitle from '@/components/page-title';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { Printer } from 'lucide-react';

interface AccountDetail {
    code: string;
    name: string;
    balances: number[];
}

interface PageProps {
    year: number;
    monthNames: string[];
    assetDetails: AccountDetail[];
    liabilityDetails: AccountDetail[];
    equityDetails: AccountDetail[];
    monthlyTotals: {
        assets: number[];
        liabilities: number[];
        equity: number[];
        net_profit: number[];
    };
    availableYears: number[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports' },
    { title: 'Neraca Bulanan Detail', href: '#' },
];

export default function MonthlyBalanceSheetIndex({
    year,
    monthNames,
    assetDetails,
    liabilityDetails,
    equityDetails,
    monthlyTotals,
    availableYears,
}: PageProps) {
    
    const handleYearChange = (newYear: string) => {
        router.get('/reports/monthly-balance-sheet', { year: newYear }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePrint = () => {
        window.open(`/reports/monthly-balance-sheet/print?year=${year}`, '_blank');
    };

    const renderAccountRows = (details: AccountDetail[]) => {
        return details.map((account, index) => (
            <TableRow key={`${account.code}-${index}`} className="dark:border-b-2 dark:border-white/25">
                <TableCell className="sticky left-0 bg-background z-10 font-mono text-xs whitespace-nowrap border-r">
                    {account.code} - {account.name}
                </TableCell>
                {account.balances.map((balance, bIdx) => (
                    <TableCell key={bIdx} className="text-right text-xs whitespace-nowrap">
                        {formatCurrency(balance)}
                    </TableCell>
                ))}
            </TableRow>
        ));
    };

    const renderTotalRow = (title: string, totals: number[], className = "") => (
        <TableRow className={`bg-muted/50 font-bold dark:bg-primary-800/10 ${className}`}>
            <TableCell className="sticky left-0 bg-muted/50 dark:bg-primary-800/20 z-10 border-r">
                {title}
            </TableCell>
            {totals.map((total, idx) => (
                <TableCell key={idx} className="text-right whitespace-nowrap">
                    {formatCurrency(total)}
                </TableCell>
            ))}
        </TableRow>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Neraca Bulanan Detail" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Neraca Bulanan Detail" />
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Tahun:</span>
                        <Select value={year.toString()} onValueChange={handleYearChange}>
                            <SelectTrigger className="w-[120px] input-box">
                                <SelectValue placeholder="Pilih Tahun" />
                            </SelectTrigger>
                            <SelectContent className="content">
                                {availableYears.map((y) => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="btn-primary"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak PDF
                    </Button>
                </div>
            </div>

            <Card className="content">
                <CardHeader>
                    <CardTitle>Neraca Komparatif Bulanan - Tahun {year}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="input-box overflow-x-auto rounded-lg">
                        <Table className="content border-collapse">
                            <TableHeader>
                                <TableRow className="dark:border-b-2 dark:border-white/25">
                                    <TableHead className="sticky left-0 bg-background z-20 border-r min-w-[250px]">Akun</TableHead>
                                    {monthNames.map((month, idx) => (
                                        <TableHead key={idx} className="text-center min-w-[120px]">{month}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* ASSETS SECTION */}
                                <TableRow className="bg-primary/5 dark:bg-primary/20">
                                    <TableCell colSpan={13} className="font-bold sticky left-0 z-10">AKTIVA (ASET)</TableCell>
                                </TableRow>
                                {renderAccountRows(assetDetails)}
                                {renderTotalRow("TOTAL AKTIVA", monthlyTotals.assets, "text-primary")}

                                {/* LIABILITIES SECTION */}
                                <TableRow className="bg-primary/5 dark:bg-primary/20">
                                    <TableCell colSpan={13} className="font-bold sticky left-0 z-10">KEWAJIBAN (PASIVA)</TableCell>
                                </TableRow>
                                {renderAccountRows(liabilityDetails)}
                                {renderTotalRow("TOTAL KEWAJIBAN", monthlyTotals.liabilities, "text-orange-600")}

                                {/* EQUITY SECTION */}
                                <TableRow className="bg-primary/5 dark:bg-primary/20">
                                    <TableCell colSpan={13} className="font-bold sticky left-0 z-10">EKUITAS (MODAL)</TableCell>
                                </TableRow>
                                {renderAccountRows(equityDetails)}
                                {renderTotalRow("TOTAL EKUITAS", monthlyTotals.equity, "text-green-600")}

                                {/* BALANCE CHECK */}
                                <TableRow className="bg-muted font-bold dark:bg-primary-900/40">
                                    <TableCell className="sticky left-0 bg-muted dark:bg-primary-900/60 z-10 border-r">
                                        PASIVA + EKUITAS
                                    </TableCell>
                                    {monthlyTotals.liabilities.map((l, idx) => (
                                        <TableCell key={idx} className="text-right whitespace-nowrap">
                                            {formatCurrency(l + monthlyTotals.equity[idx])}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                
                                <TableRow className="font-bold">
                                    <TableCell className="sticky left-0 bg-background z-10 border-r">
                                        STATUS
                                    </TableCell>
                                    {monthlyTotals.assets.map((a, idx) => {
                                        const diff = Math.abs(a - (monthlyTotals.liabilities[idx] + monthlyTotals.equity[idx]));
                                        const isBalanced = diff < 0.01;
                                        return (
                                            <TableCell key={idx} className="text-center">
                                                {isBalanced ? (
                                                    <span className="text-green-600 font-bold">✓</span>
                                                ) : (
                                                    <span className="text-red-600 font-bold" title={`Selisih: ${diff}`}>✗</span>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <div className="mt-4 text-sm text-muted-foreground flex flex-col gap-1">
                <p>* Laba/Rugi Tahun Berjalan dihitung dari awal tahun sampai akhir bulan tersebut.</p>
                <p>* Total Ekuitas sudah termasuk Laba/Rugi Tahun Berjalan.</p>
                <p>* Geser tabel ke kanan untuk melihat bulan-bulan berikutnya.</p>
            </div>
        </AppLayout>
    );
}
