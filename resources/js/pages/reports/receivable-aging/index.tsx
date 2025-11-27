import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { DatePicker } from '@/components/date-picker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Search, Printer } from 'lucide-react';

interface CustomerSummary {
    customer_id: number | null;
    customer_name: string;
    count: number;
    total_remaining: number;
    age_0_30: number;
    age_31_60: number;
    age_61_90: number;
    age_over_90: number;
}

interface AgingData {
    sale_id: number;
    sale_number: string;
    sale_date: string;
    due_date: string;
    customer_id: number | null;
    customer_name: string;
    total_amount: number;
    total_paid: number;
    remaining_amount: number;
    days_overdue: number;
    days_until_due: number;
    age_0_30: number;
    age_31_60: number;
    age_61_90: number;
    age_over_90: number;
}

interface PageProps {
    asOfDate: string;
    summary: {
        total_0_30: number;
        total_31_60: number;
        total_61_90: number;
        total_over_90: number;
        grand_total: number;
    };
    customerSummary: CustomerSummary[];
    agingData: AgingData[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Piutang Usaha', href: '#' },
];

export default function ReceivableAgingIndex({
    asOfDate,
    summary,
    customerSummary,
    agingData,
}: PageProps) {
    const [filters, setFilters] = useState({
        as_of_date: asOfDate,
    });

    const handleFilter = () => {
        router.get('/reports/receivable-aging', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Piutang Usaha (Aging)" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Laporan Piutang Usaha (Aging)" />
            </div>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Filter Tanggal</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="as_of_date">Per Tanggal</Label>
                            <DatePicker
                                value={filters.as_of_date ? new Date(filters.as_of_date) : undefined}
                                onChange={(date) =>
                                    setFilters({
                                        ...filters,
                                        as_of_date: date ? format(date, 'yyyy-MM-dd') : '',
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
                                        as_of_date: filters.as_of_date,
                                    });
                                    window.open(`/reports/receivable-aging/print?${params.toString()}`, '_blank');
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
            <div className="grid gap-4 md:grid-cols-5 mb-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">0-30 Hari</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_0_30)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">31-60 Hari</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.total_31_60)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">61-90 Hari</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.total_61_90)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{'>'} 90 Hari</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_over_90)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Piutang</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.grand_total)}</div>
                    </CardContent>
                </Card>
            </div>

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
                                        <TableHead className="text-right">Total Piutang</TableHead>
                                        <TableHead className="text-right">0-30 Hari</TableHead>
                                        <TableHead className="text-right">31-60 Hari</TableHead>
                                        <TableHead className="text-right">61-90 Hari</TableHead>
                                        <TableHead className="text-right">{'>'} 90 Hari</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customerSummary.map((customer, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{customer.customer_name}</TableCell>
                                            <TableCell className="text-right">{customer.count}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(customer.total_remaining)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(customer.age_0_30)}</TableCell>
                                            <TableCell className="text-right text-yellow-600">{formatCurrency(customer.age_31_60)}</TableCell>
                                            <TableCell className="text-right text-orange-600">{formatCurrency(customer.age_61_90)}</TableCell>
                                            <TableCell className="text-right text-red-600">{formatCurrency(customer.age_over_90)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detail Aging */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Piutang Usaha</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Per Tanggal: {format(new Date(asOfDate), 'dd MMM yyyy')}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Penjualan</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Jatuh Tempo</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Sudah Dibayar</TableHead>
                                    <TableHead className="text-right">Sisa</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">0-30</TableHead>
                                    <TableHead className="text-right">31-60</TableHead>
                                    <TableHead className="text-right">61-90</TableHead>
                                    <TableHead className="text-right">{'>'} 90</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agingData.length > 0 ? (
                                    agingData.map((item) => (
                                        <TableRow key={item.sale_id}>
                                            <TableCell className="font-mono">{item.sale_number}</TableCell>
                                            <TableCell>{formatDatetoString(new Date(item.sale_date))}</TableCell>
                                            <TableCell>{formatDatetoString(new Date(item.due_date))}</TableCell>
                                            <TableCell>{item.customer_name}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.total_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.total_paid)}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(item.remaining_amount)}</TableCell>
                                            <TableCell className="text-center">
                                                {item.days_overdue > 0 ? (
                                                    <Badge variant="destructive">{item.days_overdue} hari</Badge>
                                                ) : (
                                                    <Badge variant="default">{item.days_until_due} hari</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.age_0_30)}</TableCell>
                                            <TableCell className="text-right text-yellow-600">{formatCurrency(item.age_31_60)}</TableCell>
                                            <TableCell className="text-right text-orange-600">{formatCurrency(item.age_61_90)}</TableCell>
                                            <TableCell className="text-right text-red-600">{formatCurrency(item.age_over_90)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={12} className="text-center text-muted-foreground">
                                            Tidak ada data piutang
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="font-semibold bg-muted/50">
                                    <TableCell colSpan={8}>Total</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.total_0_30)}</TableCell>
                                    <TableCell className="text-right text-yellow-600">{formatCurrency(summary.total_31_60)}</TableCell>
                                    <TableCell className="text-right text-orange-600">{formatCurrency(summary.total_61_90)}</TableCell>
                                    <TableCell className="text-right text-red-600">{formatCurrency(summary.total_over_90)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

