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

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_returns: number;
        total_subtotal: number;
        total_discount1: number;
        total_discount2: number;
        total_after_discount: number;
        total_ppn: number;
        total_amount: number;
    };
    byReturnType: Record<string, { count: number; total_amount: number }>;
    bySupplier: Array<{
        supplier_id: number | null;
        supplier_name: string;
        count: number;
        total_amount: number;
    }>;
    purchaseReturns: Array<{
        id: number;
        return_number: string;
        return_date: string;
        purchase_number: string;
        supplier_name: string;
        return_type: string;
        refund_method: string;
        subtotal: number;
        discount1_amount: number;
        discount2_amount: number;
        total_after_discount: number;
        ppn_amount: number;
        total_amount: number;
        reason: string;
    }>;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Retur Pembelian', href: '#' },
];

export default function PurchaseReturnReportIndex({
    dateFrom,
    dateTo,
    summary,
    byReturnType,
    bySupplier,
    purchaseReturns,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
    });

    const handleFilter = () => {
        router.get('/reports/purchase-return', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Retur Pembelian" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Retur Pembelian" />
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
                                    window.open(`/reports/purchase-return/print?${params.toString()}`, '_blank');
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

            <div className="grid gap-4 md:grid-cols-4 mb-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Retur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_returns}</div>
                        <p className="text-xs text-muted-foreground mt-1">Transaksi retur</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Subtotal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_subtotal)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Sebelum diskon</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Diskon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_discount1 + summary.total_discount2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Diskon 1 + Diskon 2</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Retur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_amount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Setelah PPN</p>
                    </CardContent>
                </Card>
            </div>

            {Object.keys(byReturnType).length > 0 && (
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Ringkasan per Tipe Retur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipe Retur</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(byReturnType).map(([type, data]) => (
                                        <TableRow key={type}>
                                            <TableCell>{type === 'stock_only' ? 'Retur Stok' : 'Retur + Refund'}</TableCell>
                                            <TableCell className="text-right">{data.count}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(data.total_amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {bySupplier.length > 0 && (
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
                                        <TableHead className="text-right">Jumlah</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bySupplier.map((supplier) => (
                                        <TableRow key={supplier.supplier_id || 'no-supplier'}>
                                            <TableCell>{supplier.supplier_name}</TableCell>
                                            <TableCell className="text-right">{supplier.count}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(supplier.total_amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Detail Retur Pembelian</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Retur</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>No. Pembelian</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Metode Refund</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                    <TableHead className="text-right">Diskon</TableHead>
                                    <TableHead className="text-right">PPN</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseReturns.length > 0 ? (
                                    purchaseReturns.map((returnItem) => (
                                        <TableRow key={returnItem.id}>
                                            <TableCell className="font-mono">{returnItem.return_number}</TableCell>
                                            <TableCell>{format(new Date(returnItem.return_date), 'dd MMM yyyy')}</TableCell>
                                            <TableCell className="font-mono">{returnItem.purchase_number}</TableCell>
                                            <TableCell>{returnItem.supplier_name}</TableCell>
                                            <TableCell>{returnItem.return_type === 'stock_only' ? 'Retur Stok' : 'Retur + Refund'}</TableCell>
                                            <TableCell>{returnItem.refund_method === 'reduce_payable' ? 'Kurangi Hutang' : 'Cash Refund'}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(returnItem.subtotal)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(returnItem.discount1_amount + returnItem.discount2_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(returnItem.ppn_amount)}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(returnItem.total_amount)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center text-muted-foreground">
                                            Tidak ada data retur
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="font-semibold bg-muted/50">
                                    <TableCell colSpan={6}>Total</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_subtotal)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_discount1 + summary.total_discount2)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_ppn)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_amount)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
