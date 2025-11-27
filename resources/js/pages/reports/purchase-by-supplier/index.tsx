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

interface SupplierPurchase {
    supplier_id: number | null;
    supplier_name: string;
    transaction_count: number;
    total_purchases: number;
    total_subtotal: number;
    total_discount: number;
    total_ppn: number;
    avg_purchase_value: number;
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_suppliers: number;
        total_transactions: number;
        total_purchases: number;
        total_subtotal: number;
        total_discount: number;
        total_ppn: number;
        avg_purchase_value: number;
    };
    supplierPurchases: SupplierPurchase[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Pembelian per Supplier', href: '#' },
];

export default function PurchaseBySupplierIndex({
    dateFrom,
    dateTo,
    summary,
    supplierPurchases,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
    });

    const handleFilter = () => {
        router.get('/reports/purchase-by-supplier', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Pembelian per Supplier" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Pembelian per Supplier" />
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
                                    });
                                    window.open(`/reports/purchase-by-supplier/print?${params.toString()}`, '_blank');
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
                        <CardTitle className="text-sm font-medium">Total Supplier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_suppliers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Supplier aktif</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_transactions.toLocaleString('id-ID')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Pembelian</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_purchases)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Setelah PPN</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Rata-rata</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.avg_purchase_value)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Per transaksi</p>
                    </CardContent>
                </Card>
            </div>

            {/* Supplier Purchases Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Pembelian per Supplier</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead className="text-right">Transaksi</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                    <TableHead className="text-right">Diskon</TableHead>
                                    <TableHead className="text-right">PPN</TableHead>
                                    <TableHead className="text-right">Total Pembelian</TableHead>
                                    <TableHead className="text-right">Rata-rata</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {supplierPurchases.length > 0 ? (
                                    supplierPurchases.map((supplier) => (
                                        <TableRow key={supplier.supplier_id || 'no-supplier'}>
                                            <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                                            <TableCell className="text-right">{supplier.transaction_count.toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(supplier.total_subtotal)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(supplier.total_discount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(supplier.total_ppn)}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(supplier.total_purchases)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(supplier.avg_purchase_value)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                                            Tidak ada data pembelian
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="font-semibold bg-muted/50">
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right">{summary.total_transactions.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_subtotal)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_discount)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_ppn)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_purchases)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.avg_purchase_value)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

