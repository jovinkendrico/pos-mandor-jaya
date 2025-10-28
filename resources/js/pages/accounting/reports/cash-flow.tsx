import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { getSummary } from '@/routes/cash-flows';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Calendar, Download, Search } from 'lucide-react';
import { useState } from 'react';

interface CashFlowSummary {
    period: {
        start_date: string;
        end_date: string;
    };
    summary: {
        cash_in: number;
        cash_out: number;
        net_cash_flow: number;
    };
    cash_in_by_category: any[];
    cash_out_by_category: any[];
}

interface PageProps {
    summary?: CashFlowSummary;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounting',
        href: '#',
    },
    {
        title: 'Reports',
        href: '#',
    },
    {
        title: 'Cash Flow',
        href: '#',
    },
];

export default function CashFlowReport({ summary }: PageProps) {
    const [startDate, setStartDate] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    const handleSearch = () => {
        getSummary({ start_date: startDate, end_date: endDate });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cash Flow Report" />
            <div className="space-y-6">
                <PageTitle title="Cash Flow Report" />
                
                {/* Filter Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filter Periode</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <Label htmlFor="start_date">Tanggal Mulai</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="end_date">Tanggal Akhir</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleSearch} className="btn-primary">
                                <Search className="w-4 h-4 mr-2" />
                                Cari
                            </Button>
                            <Button variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Pemasukan
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {formatCurrency(summary.summary.cash_in)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Pengeluaran
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(summary.summary.cash_out)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Net Cash Flow
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${
                                    summary.summary.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatCurrency(summary.summary.net_cash_flow)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Cash Flow by Category */}
                {summary && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pemasukan per Kategori</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {summary.cash_in_by_category.map((item, index) => (
                                        <div key={index} className="flex justify-between">
                                            <span>{item.category?.name || 'Unknown'}</span>
                                            <span className="font-medium text-green-600">
                                                {formatCurrency(item.total_amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Pengeluaran per Kategori</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {summary.cash_out_by_category.map((item, index) => (
                                        <div key={index} className="flex justify-between">
                                            <span>{item.category?.name || 'Unknown'}</span>
                                            <span className="font-medium text-red-600">
                                                {formatCurrency(item.total_amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
