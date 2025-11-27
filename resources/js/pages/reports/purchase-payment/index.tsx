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
        total_payments: number;
        total_amount: number;
    };
    byPaymentMethod: Record<string, { count: number; total_amount: number }>;
    byBank: Array<{
        bank_id: number;
        bank_name: string;
        count: number;
        total_amount: number;
    }>;
    bySupplier: Array<{
        supplier_id: number | null;
        supplier_name: string;
        count: number;
        total_amount: number;
    }>;
    purchasePayments: Array<{
        id: number;
        payment_number: string;
        payment_date: string;
        bank_name: string;
        payment_method: string;
        reference_number: string;
        total_amount: number;
        notes: string;
        purchases_count: number;
    }>;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Pembayaran Pembelian', href: '#' },
];

export default function PurchasePaymentReportIndex({
    dateFrom,
    dateTo,
    summary,
    byPaymentMethod,
    byBank,
    bySupplier,
    purchasePayments,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
    });

    const handleFilter = () => {
        router.get('/reports/purchase-payment', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            cash: 'Tunai',
            transfer: 'Transfer',
            giro: 'Giro',
            cek: 'Cek',
            other: 'Lainnya',
            refund: 'Refund',
        };
        return labels[method] || method;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Pembayaran Pembelian" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Pembayaran Pembelian" />
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
                                    window.open(`/reports/purchase-payment/print?${params.toString()}`, '_blank');
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

            <div className="grid gap-4 md:grid-cols-2 mb-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_payments}</div>
                        <p className="text-xs text-muted-foreground mt-1">Transaksi pembayaran</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Jumlah</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_amount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total pembayaran</p>
                    </CardContent>
                </Card>
            </div>

            {Object.keys(byPaymentMethod).length > 0 && (
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Ringkasan per Metode Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Metode</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(byPaymentMethod).map(([method, data]) => (
                                        <TableRow key={method}>
                                            <TableCell>{getPaymentMethodLabel(method)}</TableCell>
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

            {byBank.length > 0 && (
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Ringkasan per Bank</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bank</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {byBank.map((bank) => (
                                        <TableRow key={bank.bank_id}>
                                            <TableCell>{bank.bank_name}</TableCell>
                                            <TableCell className="text-right">{bank.count}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(bank.total_amount)}</TableCell>
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
                    <CardTitle>Detail Pembayaran Pembelian</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Pembayaran</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Bank</TableHead>
                                    <TableHead>Metode</TableHead>
                                    <TableHead>No. Referensi</TableHead>
                                    <TableHead className="text-right">Jumlah Pembelian</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchasePayments.length > 0 ? (
                                    purchasePayments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-mono">{payment.payment_number}</TableCell>
                                            <TableCell>{format(new Date(payment.payment_date), 'dd MMM yyyy')}</TableCell>
                                            <TableCell>{payment.bank_name}</TableCell>
                                            <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                                            <TableCell>{payment.reference_number || '-'}</TableCell>
                                            <TableCell className="text-right">{payment.purchases_count}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(payment.total_amount)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                                            Tidak ada data pembayaran
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="font-semibold bg-muted/50">
                                    <TableCell colSpan={6}>Total</TableCell>
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

