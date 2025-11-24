import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { Search, AlertTriangle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StockItem {
    item_id: number;
    item_code: string;
    item_name: string;
    stock: number;
    unit: string;
}

interface PageProps {
    minStockThreshold: number;
    maxStockThreshold: number;
    summary: {
        total_items: number;
        items_with_stock: number;
        items_without_stock: number;
        low_stock_count: number;
        high_stock_count: number;
        zero_stock_count: number;
        min_stock_threshold: number;
        max_stock_threshold: number;
    };
    lowStockItems: StockItem[];
    highStockItems: StockItem[];
    zeroStockItems: StockItem[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Stok Minimum/Maksimum', href: '#' },
];

export default function StockMinMaxIndex({
    minStockThreshold,
    maxStockThreshold,
    summary,
    lowStockItems,
    highStockItems,
    zeroStockItems,
}: PageProps) {
    const [filters, setFilters] = useState({
        min_stock: minStockThreshold.toString(),
        max_stock: maxStockThreshold.toString(),
    });

    const handleFilter = () => {
        router.get('/reports/stock-min-max', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Stok Minimum/Maksimum" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Stok Minimum/Maksimum" />
            </div>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Filter Threshold</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="min_stock">Stok Minimum</Label>
                            <Input
                                id="min_stock"
                                type="number"
                                min="0"
                                value={filters.min_stock}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        min_stock: e.target.value,
                                    })
                                }
                                placeholder="10"
                            />
                            <p className="text-xs text-muted-foreground">Item dengan stok ≤ threshold ini akan ditampilkan</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_stock">Stok Maksimum</Label>
                            <Input
                                id="max_stock"
                                type="number"
                                min="0"
                                value={filters.max_stock}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        max_stock: e.target.value,
                                    })
                                }
                                placeholder="1000"
                            />
                            <p className="text-xs text-muted-foreground">Item dengan stok {'>'} threshold ini akan ditampilkan</p>
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
                        <p className="text-xs text-muted-foreground mt-1">Semua item</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Dengan Stok</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary.items_with_stock}</div>
                        <p className="text-xs text-muted-foreground mt-1">Item tersedia</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Tanpa Stok</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary.zero_stock_count}</div>
                        <p className="text-xs text-muted-foreground mt-1">Habis</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{summary.low_stock_count}</div>
                        <p className="text-xs text-muted-foreground mt-1">≤ {summary.min_stock_threshold}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Stok Tinggi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{summary.high_stock_count}</div>
                        <p className="text-xs text-muted-foreground mt-1">{'>'} {summary.max_stock_threshold}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Zero Stock Items */}
            {zeroStockItems.length > 0 && (
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Item Tanpa Stok ({zeroStockItems.length})
                        </CardTitle>
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {zeroStockItems.map((item) => (
                                        <TableRow key={item.item_id}>
                                            <TableCell className="font-mono">{item.item_code}</TableCell>
                                            <TableCell className="font-medium">{item.item_name}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="destructive">{item.stock.toLocaleString('id-ID')}</Badge>
                                            </TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Low Stock Items */}
            {lowStockItems.length > 0 && (
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            Item Stok Rendah (≤ {summary.min_stock_threshold}) ({lowStockItems.length})
                        </CardTitle>
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lowStockItems.map((item) => (
                                        <TableRow key={item.item_id}>
                                            <TableCell className="font-mono">{item.item_code}</TableCell>
                                            <TableCell className="font-medium">{item.item_name}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                                    {item.stock.toLocaleString('id-ID')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* High Stock Items */}
            {highStockItems.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            Item Stok Tinggi ({'>'} {summary.max_stock_threshold}) ({highStockItems.length})
                        </CardTitle>
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {highStockItems.map((item) => (
                                        <TableRow key={item.item_id}>
                                            <TableCell className="font-mono">{item.item_code}</TableCell>
                                            <TableCell className="font-medium">{item.item_name}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                                    {item.stock.toLocaleString('id-ID')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {zeroStockItems.length === 0 && lowStockItems.length === 0 && highStockItems.length === 0 && (
                <Card>
                    <CardContent className="py-8">
                        <p className="text-center text-muted-foreground">Tidak ada item yang sesuai dengan kriteria filter</p>
                    </CardContent>
                </Card>
            )}
        </AppLayout>
    );
}

