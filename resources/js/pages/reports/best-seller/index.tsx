import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { DatePicker } from '@/components/date-picker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Search, Trophy, TrendingUp, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PageProps {
    dateFrom: string;
    dateTo: string;
    sortBy: string;
    limit: number;
    summary: {
        total_items: number;
        total_quantity: number;
        total_revenue: number;
        total_profit: number;
        profit_margin: number;
    };
    bestSellers: Array<{
        rank: number;
        item_id: number;
        item_code: string;
        item_name: string;
        total_quantity: number;
        transaction_count: number;
        total_revenue: number;
        total_cost: number;
        total_profit: number;
        avg_price: number;
        avg_cost: number;
        profit_margin: number;
    }>;
    trendData: Array<{
        item_id: number;
        item_code: string;
        item_name: string;
        daily_data: Array<{
            date: string;
            quantity: number;
            revenue: number;
        }>;
    }>;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports' },
    { title: 'Laporan Barang Paling Laku', href: '#' },
];

export default function BestSellerReportIndex({
    dateFrom,
    dateTo,
    sortBy,
    limit,
    summary,
    bestSellers,
    trendData,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
        sort_by: sortBy,
        limit: limit.toString(),
    });

    const handleFilter = () => {
        router.get('/reports/best-seller', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return <Badge className="bg-yellow-500 text-white">🥇 1</Badge>;
        if (rank === 2) return <Badge className="bg-gray-400 text-white">🥈 2</Badge>;
        if (rank === 3) return <Badge className="bg-orange-600 text-white">🥉 3</Badge>;
        return <Badge variant="outline">{rank}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Barang Paling Laku" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Barang Paling Laku (Best Seller)" />
            </div>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                            <Label htmlFor="sort_by">Urutkan Berdasarkan</Label>
                            <Select
                                value={filters.sort_by}
                                onValueChange={(value) =>
                                    setFilters({
                                        ...filters,
                                        sort_by: value,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="quantity">Quantity</SelectItem>
                                    <SelectItem value="revenue">Revenue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="limit">Jumlah Item</Label>
                            <Input
                                id="limit"
                                type="number"
                                min="10"
                                max="200"
                                value={filters.limit}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        limit: e.target.value,
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
                                        date_from: filters.date_from,
                                        date_to: filters.date_to,
                                        sort_by: filters.sort_by,
                                        limit: filters.limit.toString(),
                                    });
                                    window.open(`/reports/best-seller/print?${params.toString()}`, '_blank');
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
                        <CardTitle className="text-sm font-medium">Total Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_items}</div>
                        <p className="text-xs text-muted-foreground mt-1">Item terlaris</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_quantity.toLocaleString('id-ID')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Unit terjual</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_revenue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Pendapatan</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_profit)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Margin: {summary.profit_margin.toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Best Sellers Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Ranking Barang Paling Laku
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
                        {' | '}Diurutkan berdasarkan: {sortBy === 'quantity' ? 'Quantity' : 'Revenue'}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead style={{ width: '5%' }}>Rank</TableHead>
                                    <TableHead style={{ width: '12%' }}>Kode</TableHead>
                                    <TableHead style={{ width: '25%' }}>Nama Barang</TableHead>
                                    <TableHead className="text-right" style={{ width: '10%' }}>Quantity</TableHead>
                                    <TableHead className="text-right" style={{ width: '8%' }}>Transaksi</TableHead>
                                    <TableHead className="text-right" style={{ width: '12%' }}>Revenue</TableHead>
                                    <TableHead className="text-right" style={{ width: '12%' }}>Cost</TableHead>
                                    <TableHead className="text-right" style={{ width: '12%' }}>Profit</TableHead>
                                    <TableHead className="text-right" style={{ width: '8%' }}>Margin</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bestSellers.length > 0 ? (
                                    bestSellers.map((item) => (
                                        <TableRow key={item.item_id}>
                                            <TableCell>{getRankBadge(item.rank)}</TableCell>
                                            <TableCell className="font-mono">{item.item_code}</TableCell>
                                            <TableCell className="font-medium">{item.item_name}</TableCell>
                                            <TableCell className="text-right">{item.total_quantity.toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right">{item.transaction_count}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.total_revenue)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.total_cost)}</TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">{formatCurrency(item.total_profit)}</TableCell>
                                            <TableCell className="text-right">{item.profit_margin.toFixed(2)}%</TableCell>
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

