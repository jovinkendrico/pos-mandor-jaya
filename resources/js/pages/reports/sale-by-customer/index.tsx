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

interface CustomerSale {
    customer_id: number | null;
    customer_name: string;
    transaction_count: number;
    total_sales: number;
    total_amount: number;
    total_cost: number;
    total_profit: number;
    total_discount: number;
    total_ppn: number;
    profit_margin: number;
    avg_sale_value: number;
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_customers: number;
        total_transactions: number;
        total_sales: number;
        total_amount: number;
        total_cost: number;
        total_profit: number;
        total_discount: number;
        total_ppn: number;
        profit_margin: number;
        avg_sale_value: number;
    };
    customerSales: CustomerSale[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Penjualan per Customer', href: '#' },
];

export default function SaleByCustomerIndex({
    dateFrom,
    dateTo,
    summary,
    customerSales,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
    });

    const handleFilter = () => {
        router.get('/reports/sale-by-customer', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Penjualan per Customer" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Penjualan per Customer" />
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
                                    window.open(`/reports/sale-by-customer/print?${params.toString()}`, '_blank');
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
                        <CardTitle className="text-sm font-medium">Total Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_customers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Customer aktif</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_transactions.toLocaleString('id-ID')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Penjualan</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_sales)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Setelah diskon</p>
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

            {/* Customer Sales Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Penjualan per Customer</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} - {format(new Date(dateTo), 'dd MMM yyyy')}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Transaksi</TableHead>
                                    <TableHead className="text-right">Total Penjualan</TableHead>
                                    <TableHead className="text-right">Diskon</TableHead>
                                    <TableHead className="text-right">PPN</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead className="text-right">Total Cost</TableHead>
                                    <TableHead className="text-right">Profit</TableHead>
                                    <TableHead className="text-right">Margin</TableHead>
                                    <TableHead className="text-right">Rata-rata</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customerSales.length > 0 ? (
                                    customerSales.map((customer) => (
                                        <TableRow key={customer.customer_id || 'no-customer'}>
                                            <TableCell className="font-medium">{customer.customer_name}</TableCell>
                                            <TableCell className="text-right">{customer.transaction_count.toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(customer.total_sales)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(customer.total_discount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(customer.total_ppn)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(customer.total_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(customer.total_cost)}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(customer.total_profit)}</TableCell>
                                            <TableCell className="text-right">{customer.profit_margin.toFixed(2)}%</TableCell>
                                            <TableCell className="text-right">{formatCurrency(customer.avg_sale_value)}</TableCell>
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
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right">{summary.total_transactions.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_sales)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_discount)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_ppn)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_amount)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_cost)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_profit)}</TableCell>
                                    <TableCell className="text-right">{summary.profit_margin.toFixed(2)}%</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.avg_sale_value)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

