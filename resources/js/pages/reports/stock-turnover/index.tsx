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
import { Search, Zap, Clock, Snail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_items: number;
        fast_moving_count: number;
        medium_moving_count: number;
        slow_moving_count: number;
        avg_turnover_ratio: number;
        total_stock_value: number;
    };
    turnoverData: Array<{
        item_id: number;
        item_code: string;
        item_name: string;
        stock: number;
        unit: string;
        total_sales: number;
        avg_stock: number;
        avg_cost: number;
        stock_value: number;
        turnover_ratio: number;
        days_to_turnover: number;
        turnover_category: string;
    }>;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports' },
    { title: 'Laporan Perputaran Stok', href: '#' },
];

export default function StockTurnoverReportIndex({
    dateFrom,
    dateTo,
    summary,
    turnoverData,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
    });

    const handleFilter = () => {
        router.get('/reports/stock-turnover', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getCategoryBadge = (category: string) => {
        if (category === 'fast') {
            return (
                <Badge className="bg-green-600 text-white">
                    <Zap className="h-3 w-3 mr-1" />
                    Cepat
                </Badge>
            );
        }
        if (category === 'medium') {
            return (
                <Badge className="bg-yellow-600 text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    Sedang
                </Badge>
            );
        }
        return (
            <Badge className="bg-red-600 text-white">
                <Snail className="h-3 w-3 mr-1" />
                Lambat
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Perputaran Stok" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Perputaran Stok (Stock Turnover)" />
            </div>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Filter Periode</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="flex items-end">
                            <Button onClick={handleFilter} className="w-full">
                                <Search className="mr-2 h-4 w-4" />
                                Tampilkan
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-5 mb-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_items}</div>
                        <p className="text-xs text-muted-foreground mt-1">Item dianalisis</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                            <Zap className="h-4 w-4" />
                            Cepat
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary.fast_moving_count}</div>
                        <p className="text-xs text-muted-foreground mt-1">≥ 12x per tahun</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-600">
                            <Clock className="h-4 w-4" />
                            Sedang
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{summary.medium_moving_count}</div>
                        <p className="text-xs text-muted-foreground mt-1">6-12x per tahun</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                            <Snail className="h-4 w-4" />
                            Lambat
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary.slow_moving_count}</div>
                        <p className="text-xs text-muted-foreground mt-1">{'<'} 6x per tahun</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Rata-rata Ratio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.avg_turnover_ratio.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Perputaran stok</p>
                    </CardContent>
                </Card>
            </div>

            {/* Turnover Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Analisis Perputaran Stok</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
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
                                    <TableHead className="text-right">Total Penjualan</TableHead>
                                    <TableHead className="text-right">Nilai Persediaan</TableHead>
                                    <TableHead className="text-right">Turnover Ratio</TableHead>
                                    <TableHead className="text-right">Hari untuk Turnover</TableHead>
                                    <TableHead>Kategori</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {turnoverData.length > 0 ? (
                                    turnoverData.map((item) => (
                                        <TableRow key={item.item_id}>
                                            <TableCell className="font-mono">{item.item_code}</TableCell>
                                            <TableCell className="font-medium">{item.item_name}</TableCell>
                                            <TableCell className="text-right">{item.stock.toLocaleString('id-ID')}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell className="text-right">{item.total_sales.toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.stock_value)}</TableCell>
                                            <TableCell className="text-right font-semibold">{item.turnover_ratio.toFixed(2)}x</TableCell>
                                            <TableCell className="text-right">{item.days_to_turnover.toFixed(0)} hari</TableCell>
                                            <TableCell>{getCategoryBadge(item.turnover_category)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                                            Tidak ada data
                                        </TableCell>
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

