import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { DatePicker } from '@/components/date-picker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Search, AlertTriangle, AlertCircle, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PageProps {
    dateFrom: string;
    dateTo: string;
    minDays: number;
    summary: {
        total_items: number;
        total_stock_value: number;
        avg_days_without_sale: number;
    };
    deadStockItems: Array<{
        item_id: number;
        item_code: string;
        item_name: string;
        stock: number;
        unit: string;
        avg_cost: number;
        stock_value: number;
        last_sale_date: string | null;
        days_without_sale: number;
    }>;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports' },
    { title: 'Laporan Barang Paling Tidak Laku', href: '#' },
];

export default function DeadStockReportIndex({
    dateFrom,
    dateTo,
    minDays,
    summary,
    deadStockItems,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
        min_days: minDays.toString(),
    });

    const handleFilter = () => {
        router.get('/reports/dead-stock', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getDaysBadge = (days: number) => {
        if (days >= 365) return <Badge variant="destructive">{days} hari</Badge>;
        if (days >= 180) return <Badge className="bg-orange-600 text-white">{days} hari</Badge>;
        return <Badge variant="outline">{days} hari</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Barang Paling Tidak Laku" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Barang Paling Tidak Laku (Dead Stock)" />
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
                            <Label htmlFor="min_days">Min. Hari Tanpa Penjualan</Label>
                            <Input
                                id="min_days"
                                type="number"
                                min="30"
                                value={filters.min_days}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        min_days: e.target.value,
                                    })
                                }
                            />
                            <p className="text-xs text-muted-foreground">Item dengan hari tanpa penjualan ≥ nilai ini</p>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={handleFilter} className="flex-1">
                                <Search className="mr-2 h-4 w-4" />
                                Tampilkan
                            </Button>
                            <Button
                                onClick={() => {
                                    const params = new URLSearchParams({
                                        date_from: filters.date_from,
                                        date_to: filters.date_to,
                                        min_days: filters.min_days.toString(),
                                    });
                                    window.open(`/reports/dead-stock/print?${params.toString()}`, '_blank');
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
            <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            Total Item Dead Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary.total_items}</div>
                        <p className="text-xs text-muted-foreground mt-1">Item tidak laku</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Nilai Persediaan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_stock_value)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Nilai menganggur</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Rata-rata Hari</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round(summary.avg_days_without_sale)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Hari tanpa penjualan</p>
                    </CardContent>
                </Card>
            </div>

            {/* Dead Stock Items Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Daftar Barang Dead Stock
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
                        {' | '}Minimum: {minDays} hari tanpa penjualan
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama Barang</TableHead>
                                    <TableHead className="text-right">Stok</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">Harga Rata-rata</TableHead>
                                    <TableHead className="text-right">Nilai Persediaan</TableHead>
                                    <TableHead>Tanggal Penjualan Terakhir</TableHead>
                                    <TableHead className="text-right">Hari Tanpa Penjualan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deadStockItems.length > 0 ? (
                                    deadStockItems.map((item) => (
                                        <TableRow key={item.item_id}>
                                            <TableCell className="font-mono">{item.item_code}</TableCell>
                                            <TableCell className="font-medium">{item.item_name}</TableCell>
                                            <TableCell className="text-right">{item.stock.toLocaleString('id-ID')}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.avg_cost)}</TableCell>
                                            <TableCell className="text-right font-semibold text-red-600">{formatCurrency(item.stock_value)}</TableCell>
                                            <TableCell>
                                                {item.last_sale_date ? format(new Date(item.last_sale_date), 'dd MMM yyyy') : 'Belum pernah terjual'}
                                            </TableCell>
                                            <TableCell className="text-right">{getDaysBadge(item.days_without_sale)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                                            Tidak ada item dead stock
                                        </TableCell>
                                    </TableRow>
                                )}
                                {deadStockItems.length > 0 && (
                                    <TableRow className="font-semibold bg-muted/50">
                                        <TableCell colSpan={5}>Total</TableCell>
                                        <TableCell className="text-right text-red-600">{formatCurrency(summary.total_stock_value)}</TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

