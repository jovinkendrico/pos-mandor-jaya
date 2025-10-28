import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { getProfitLoss } from '@/routes/cash-flows';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Calculator, Download, Search } from 'lucide-react';
import { useState } from 'react';

interface ProfitLossData {
    period: {
        start_date: string;
        end_date: string;
    };
    revenue: number;
    cogs: number;
    gross_profit: number;
    operating_expenses: number;
    other_expenses: number;
    total_expenses: number;
    net_profit: number;
}

interface PageProps {
    profitLoss?: ProfitLossData;
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
        title: 'Profit & Loss',
        href: '#',
    },
];

export default function ProfitLossReport({ profitLoss }: PageProps) {
    const [startDate, setStartDate] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    const handleSearch = () => {
        getProfitLoss({ start_date: startDate, end_date: endDate });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profit & Loss Report" />
            <div className="space-y-6">
                <PageTitle title="Profit & Loss Report" />
                
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

                {/* Profit & Loss Statement */}
                {profitLoss && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="w-5 h-5" />
                                Laporan Laba Rugi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Revenue Section */}
                                <div className="border-b pb-4">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="font-semibold text-lg">PENDAPATAN</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 pl-4">
                                        <span>Revenue</span>
                                        <span className="font-medium text-green-600">
                                            {formatCurrency(profitLoss.revenue)}
                                        </span>
                                    </div>
                                </div>

                                {/* COGS Section */}
                                <div className="border-b pb-4">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="font-semibold text-lg">HARGA POKOK PENJUALAN</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 pl-4">
                                        <span>Cost of Goods Sold</span>
                                        <span className="font-medium text-red-600">
                                            ({formatCurrency(profitLoss.cogs)})
                                        </span>
                                    </div>
                                </div>

                                {/* Gross Profit */}
                                <div className="border-b pb-4">
                                    <div className="flex justify-between items-center py-2 bg-gray-50 px-4 -mx-4">
                                        <span className="font-bold text-lg">LABA KOTOR</span>
                                        <span className={`font-bold text-lg ${
                                            profitLoss.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {formatCurrency(profitLoss.gross_profit)}
                                        </span>
                                    </div>
                                </div>

                                {/* Operating Expenses */}
                                <div className="border-b pb-4">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="font-semibold text-lg">BIAYA OPERASIONAL</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 pl-4">
                                        <span>Operating Expenses</span>
                                        <span className="font-medium text-red-600">
                                            ({formatCurrency(profitLoss.operating_expenses)})
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 pl-4">
                                        <span>Other Expenses</span>
                                        <span className="font-medium text-red-600">
                                            ({formatCurrency(profitLoss.other_expenses)})
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 pl-4 border-t">
                                        <span className="font-semibold">Total Expenses</span>
                                        <span className="font-semibold text-red-600">
                                            ({formatCurrency(profitLoss.total_expenses)})
                                        </span>
                                    </div>
                                </div>

                                {/* Net Profit */}
                                <div>
                                    <div className="flex justify-between items-center py-2 bg-gray-50 px-4 -mx-4">
                                        <span className="font-bold text-xl">LABA BERSIH</span>
                                        <span className={`font-bold text-xl ${
                                            profitLoss.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {formatCurrency(profitLoss.net_profit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
