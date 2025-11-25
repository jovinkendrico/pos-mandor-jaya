import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { DatePicker } from '@/components/date-picker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Search } from 'lucide-react';

interface DailySummary {
    date: string;
    date_formatted: string;
    count: number;
    total_purchases: number;
    total_ppn: number;
    total_amount: number;
    total_discount: number;
}

interface SupplierSummary {
    supplier_id: number | null;
    supplier_name: string;
    count: number;
    total_purchases: number;
    total_amount: number;
}

interface Purchase {
    id: number;
    purchase_number: string;
    purchase_date: string;
    supplier_name: string;
    total_after_discount: number;
    discount1_amount: number;
    discount2_amount: number;
    ppn_amount: number;
    total_amount: number;
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_purchases: number;
        total_ppn: number;
        total_amount: number;
        total_discount: number;
        total_transactions: number;
        avg_purchase_value: number;
    };
    dailySummary: DailySummary[];
    supplierSummary: SupplierSummary[];
    purchases: Purchase[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Pembelian', href: '#' },
];

export default function PurchaseReportIndex({
    dateFrom,
    dateTo,
    summary,
    dailySummary,
    supplierSummary,
    purchases,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
    });

    const handleFilter = () => {
        router.get('/reports/purchase-report', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Pembelian" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Pembelian" />
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_purchases)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Tanpa PPN</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_transactions}</div>
                        <p className="text-xs text-muted-foreground mt-1">Rata-rata: {formatCurrency(summary.avg_purchase_value)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Diskon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_discount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">PPN: {formatCurrency(summary.total_ppn)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_amount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Setelah PPN</p>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Summary */}
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Ringkasan Harian</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead className="text-right">Jumlah Transaksi</TableHead>
                                    <TableHead className="text-right">Total Pembelian</TableHead>
                                    <TableHead className="text-right">Diskon</TableHead>
                                    <TableHead className="text-right">PPN</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailySummary.length > 0 ? (
                                    dailySummary.map((day, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{day.date_formatted}</TableCell>
                                            <TableCell className="text-right">{day.count}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(day.total_purchases)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(day.total_discount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(day.total_ppn)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(day.total_amount)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            Tidak ada data
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="font-semibold bg-muted/50">
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right">{summary.total_transactions}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_purchases)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_discount)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_ppn)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_amount)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Supplier Summary */}
            {supplierSummary.length > 0 && (
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Ringkasan per Supplier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead className="text-right">Jumlah Transaksi</TableHead>
                                        <TableHead className="text-right">Total Pembelian</TableHead>
                                        <TableHead className="text-right">Total Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {supplierSummary.map((supplier, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{supplier.supplier_name}</TableCell>
                                            <TableCell className="text-right">{supplier.count}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(supplier.total_purchases)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(supplier.total_amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detail Purchases */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Transaksi Pembelian</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Pembelian</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead className="text-right">Pembelian</TableHead>
                                    <TableHead className="text-right">Diskon</TableHead>
                                    <TableHead className="text-right">PPN</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.length > 0 ? (
                                    purchases.map((purchase) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell className="font-mono">{purchase.purchase_number}</TableCell>
                                            <TableCell>{formatDatetoString(new Date(purchase.purchase_date))}</TableCell>
                                            <TableCell>{purchase.supplier_name}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(purchase.total_after_discount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(purchase.discount1_amount + purchase.discount2_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(purchase.ppn_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(purchase.total_amount)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground">
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

