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
import { Search } from 'lucide-react';

interface ItemSale {
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
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_items: number;
        total_quantity: number;
        total_transactions: number;
        total_revenue: number;
        total_cost: number;
        total_profit: number;
        profit_margin: number;
    };
    itemSales: ItemSale[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Penjualan per Item', href: '#' },
];

export default function SaleByItemIndex({
    dateFrom,
    dateTo,
    summary,
    itemSales,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
    });

    const handleFilter = () => {
        router.get('/reports/sale-by-item', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Penjualan per Item" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Penjualan per Item" />
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
            <div className="grid gap-4 md:grid-cols-4 mb-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_items}</div>
                        <p className="text-xs text-muted-foreground mt-1">Item terjual</p>
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
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_profit)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Margin: {summary.profit_margin.toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Item Sales Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Penjualan per Item</CardTitle>
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
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Transaksi</TableHead>
                                    <TableHead className="text-right">Harga Rata-rata</TableHead>
                                    <TableHead className="text-right">Cost Rata-rata</TableHead>
                                    <TableHead className="text-right">Total Revenue</TableHead>
                                    <TableHead className="text-right">Total Cost</TableHead>
                                    <TableHead className="text-right">Profit</TableHead>
                                    <TableHead className="text-right">Margin</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itemSales.length > 0 ? (
                                    itemSales.map((item) => (
                                        <TableRow key={item.item_id}>
                                            <TableCell className="font-mono">{item.item_code}</TableCell>
                                            <TableCell className="font-medium">{item.item_name}</TableCell>
                                            <TableCell className="text-right">{item.total_quantity.toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right">{item.transaction_count.toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.avg_price)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.avg_cost)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.total_revenue)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.total_cost)}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(item.total_profit)}</TableCell>
                                            <TableCell className="text-right">{item.profit_margin.toFixed(2)}%</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center text-muted-foreground">
                                            Tidak ada data penjualan
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="font-semibold bg-muted/50">
                                    <TableCell colSpan={2}>Total</TableCell>
                                    <TableCell className="text-right">{summary.total_quantity.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right">{summary.total_transactions.toLocaleString('id-ID')}</TableCell>
                                    <TableCell colSpan={2}></TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_revenue)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_cost)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_profit)}</TableCell>
                                    <TableCell className="text-right">{summary.profit_margin.toFixed(2)}%</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

