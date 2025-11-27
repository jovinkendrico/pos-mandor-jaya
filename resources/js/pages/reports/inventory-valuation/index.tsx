import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { Head } from '@inertiajs/react';

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
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Nilai Persediaan" />
            </div>

            {/* Summary Cards */}
            <div className="mb-4 grid gap-4 md:grid-cols-4">
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Item
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_items}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Item dengan stok
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Quantity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_quantity.toLocaleString('id-ID')}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Total stok
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Nilai
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_value)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Nilai persediaan
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Rata-rata Nilai
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.avg_value_per_item)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Per item
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Valuation Table */}
            <Card className="content">
                <CardHeader>
                    <CardTitle>Detail Nilai Persediaan</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Nilai persediaan saat ini berdasarkan stok dan harga
                        rata-rata
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
                                        Nama Barang
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Stok
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Unit
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Harga Rata-rata
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Nilai Total
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {valuationData.length > 0 ? (
                                    valuationData.map((item) => (
                                        <TableRow
                                            key={item.item_id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-mono">
                                                {item.item_code}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.item_name}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.stock.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.unit}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.avg_cost)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(
                                                    item.total_value,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableCell
                                            colSpan={6}
                                            className="text-center text-muted-foreground"
                                        >
                                            Tidak ada data persediaan
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="bg-muted/50 font-semibold dark:bg-primary-800/10">
                                    <TableCell
                                        colSpan={2}
                                        className="text-center"
                                    >
                                        Total
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {summary.total_quantity.toLocaleString(
                                            'id-ID',
                                        )}
                                    </TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.total_value)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
