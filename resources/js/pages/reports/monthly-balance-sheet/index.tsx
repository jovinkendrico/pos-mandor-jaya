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

interface ReportData {
    month: string;
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    net_profit: number;
}

interface PageProps {
    year: number;
    reportData: ReportData[];
    availableYears: number[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports' },
    { title: 'Neraca Bulanan', href: '#' },
];

export default function MonthlyBalanceSheetIndex({
    year,
    reportData,
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Neraca Bulanan" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Neraca Bulanan" />
                
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
                    <CardTitle>Ringkasan Neraca per Bulan - Tahun {year}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="input-box overflow-x-auto rounded-lg">
                        <Table className="content">
                            <TableHeader>
                                <TableRow className="dark:border-b-2 dark:border-white/25">
                                    <TableHead className="text-center">Bulan</TableHead>
                                    <TableHead className="text-right">Total Aktiva (Aset)</TableHead>
                                    <TableHead className="text-right">Total Kewajiban</TableHead>
                                    <TableHead className="text-right">Total Ekuitas (Modal)</TableHead>
                                    <TableHead className="text-right">Laba/Rugi Berjalan</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map((data, index) => {
                                    const totalPasiva = data.total_liabilities + data.total_equity;
                                    const isBalanced = Math.abs(data.total_assets - totalPasiva) < 0.01;
                                    
                                    return (
                                        <TableRow key={index} className="dark:border-b-2 dark:border-white/25">
                                            <TableCell className="text-center font-medium">
                                                {data.month}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(data.total_assets)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(data.total_liabilities)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(data.total_equity)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(data.net_profit)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isBalanced ? (
                                                    <span className="text-green-600 dark:text-emerald-500 font-bold">✓</span>
                                                ) : (
                                                    <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <div className="mt-4 text-sm text-muted-foreground">
                <p>* Laba/Rugi Berjalan dihitung dari awal tahun sampai akhir bulan tersebut.</p>
                <p>* Total Ekuitas sudah termasuk Laba/Rugi Berjalan.</p>
            </div>
        </AppLayout>
    );
}
