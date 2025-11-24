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
    total_sales: number;
    total_ppn: number;
    total_amount: number;
    total_discount: number;
    total_cost: number;
    total_profit: number;
}

interface CustomerSummary {
    customer_id: number | null;
    customer_name: string;
    count: number;
    total_sales: number;
    total_amount: number;
    total_profit: number;
}

interface Sale {
    id: number;
    sale_number: string;
    sale_date: string;
    customer_name: string;
    total_after_discount: number;
    discount1_amount: number;
    discount2_amount: number;
    ppn_amount: number;
    total_amount: number;
    total_cost: number;
    total_profit: number;
}

interface PageProps {
    dateFrom: string;
    dateTo: string;
    summary: {
        total_sales: number;
        total_ppn: number;
        total_amount: number;
        total_discount: number;
        total_cost: number;
        total_profit: number;
        total_transactions: number;
        profit_margin: number;
        avg_sale_value: number;
        avg_profit: number;
    };
    dailySummary: DailySummary[];
    customerSummary: CustomerSummary[];
    sales: Sale[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Penjualan', href: '#' },
];

export default function SaleReportIndex({
    dateFrom,
    dateTo,
    summary,
    dailySummary,
    customerSummary,
    sales,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: dateFrom,
        date_to: dateTo,
    });

    const handleFilter = () => {
        router.get('/reports/sale-report', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Penjualan" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Penjualan" />
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
                        <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_sales)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Tanpa PPN</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_profit)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Margin: {summary.profit_margin.toFixed(2)}%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_transactions}</div>
                        <p className="text-xs text-muted-foreground mt-1">Rata-rata: {formatCurrency(summary.avg_sale_value)}</p>
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
                                    <TableHead className="text-right">Total Penjualan</TableHead>
                                    <TableHead className="text-right">Diskon</TableHead>
                                    <TableHead className="text-right">PPN</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead className="text-right">HPP</TableHead>
                                    <TableHead className="text-right">Profit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailySummary.length > 0 ? (
                                    dailySummary.map((day, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{day.date_formatted}</TableCell>
                                            <TableCell className="text-right">{day.count}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(day.total_sales)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(day.total_discount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(day.total_ppn)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(day.total_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(day.total_cost)}</TableCell>
                                            <TableCell className="text-right text-green-600">{formatCurrency(day.total_profit)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                                            Tidak ada data
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="font-semibold bg-muted/50">
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right">{summary.total_transactions}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_sales)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_discount)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_ppn)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_amount)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_cost)}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatCurrency(summary.total_profit)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Customer Summary */}
            {customerSummary.length > 0 && (
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Ringkasan per Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="text-right">Jumlah Transaksi</TableHead>
                                        <TableHead className="text-right">Total Penjualan</TableHead>
                                        <TableHead className="text-right">Total Amount</TableHead>
                                        <TableHead className="text-right">Profit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customerSummary.map((customer, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{customer.customer_name}</TableCell>
                                            <TableCell className="text-right">{customer.count}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(customer.total_sales)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(customer.total_amount)}</TableCell>
                                            <TableCell className="text-right text-green-600">{formatCurrency(customer.total_profit)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detail Sales */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Transaksi Penjualan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Penjualan</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Penjualan</TableHead>
                                    <TableHead className="text-right">Diskon</TableHead>
                                    <TableHead className="text-right">PPN</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">HPP</TableHead>
                                    <TableHead className="text-right">Profit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.length > 0 ? (
                                    sales.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell className="font-mono">{sale.sale_number}</TableCell>
                                            <TableCell>{formatDatetoString(new Date(sale.sale_date))}</TableCell>
                                            <TableCell>{sale.customer_name}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(sale.total_after_discount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(sale.discount1_amount + sale.discount2_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(sale.ppn_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(sale.total_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(sale.total_cost)}</TableCell>
                                            <TableCell className="text-right text-green-600">{formatCurrency(sale.total_profit)}</TableCell>
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

