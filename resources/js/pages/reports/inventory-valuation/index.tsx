import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

interface ValuationData {
    item_id: number;
    item_code: string;
    item_name: string;
    stock: number;
    unit: string;
    avg_cost: number;
    total_value: number;
}

interface PageProps {
    summary: {
        total_items: number;
        total_quantity: number;
        total_value: number;
        avg_value_per_item: number;
    };
    valuationData: ValuationData[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Nilai Persediaan', href: '#' },
];

export default function InventoryValuationIndex({
    summary,
    valuationData,
}: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Nilai Persediaan" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Nilai Persediaan" />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_items}</div>
                        <p className="text-xs text-muted-foreground mt-1">Item dengan stok</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_quantity.toLocaleString('id-ID')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total stok</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Nilai</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_value)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Nilai persediaan</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Rata-rata Nilai</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.avg_value_per_item)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Per item</p>
                    </CardContent>
                </Card>
            </div>

            {/* Valuation Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Nilai Persediaan</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Nilai persediaan saat ini berdasarkan stok dan harga rata-rata
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
                                    <TableHead className="text-right">Nilai Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {valuationData.length > 0 ? (
                                    valuationData.map((item) => (
                                        <TableRow key={item.item_id}>
                                            <TableCell className="font-mono">{item.item_code}</TableCell>
                                            <TableCell>{item.item_name}</TableCell>
                                            <TableCell className="text-right">{item.stock.toLocaleString('id-ID')}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.avg_cost)}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(item.total_value)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            Tidak ada data persediaan
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="font-semibold bg-muted/50">
                                    <TableCell colSpan={2}>Total</TableCell>
                                    <TableCell className="text-right">{summary.total_quantity.toLocaleString('id-ID')}</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_value)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

