import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { 
    DollarSign, 
    TrendingUp, 
    TrendingDown, 
    CreditCard, 
    FileText, 
    BarChart3,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

interface AccountingDashboardProps {
    summary?: {
        total_cash_in: number;
        total_cash_out: number;
        net_cash_flow: number;
        total_payments: number;
        pending_payments: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounting',
        href: '#',
    },
];

export default function AccountingDashboard({ summary }: AccountingDashboardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const accountingMenu = [
        {
            title: 'Categories',
            description: 'Kelola kategori income dan expense',
            href: '/accounting/categories',
            icon: FileText,
            color: 'bg-blue-500',
        },
        {
            title: 'Payments',
            description: 'Kelola pembayaran transaksi',
            href: '/accounting/payments',
            icon: CreditCard,
            color: 'bg-green-500',
        },
        {
            title: 'Cash Flows',
            description: 'Kelola cash in dan cash out',
            href: '/accounting/cash-flows',
            icon: DollarSign,
            color: 'bg-purple-500',
        },
        {
            title: 'Cash Flow Report',
            description: 'Laporan cash flow',
            href: '/accounting/reports/cash-flow',
            icon: BarChart3,
            color: 'bg-orange-500',
        },
        {
            title: 'Profit & Loss',
            description: 'Laporan laba rugi',
            href: '/accounting/reports/profit-loss',
            icon: TrendingUp,
            color: 'bg-red-500',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Accounting Dashboard" />
            <div className="space-y-6">
                <PageTitle title="Accounting Dashboard" />
                
                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Cash In
                                </CardTitle>
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {formatCurrency(summary.total_cash_in)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Cash Out
                                </CardTitle>
                                <ArrowDownRight className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(summary.total_cash_out)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Net Cash Flow
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${
                                    summary.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatCurrency(summary.net_cash_flow)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Payments
                                </CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary.total_payments}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {summary.pending_payments} pending
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Accounting Menu */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accountingMenu.map((item, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader>
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-lg ${item.color} text-white`}>
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{item.title}</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button 
                                    className="w-full" 
                                    variant="outline"
                                    onClick={() => window.location.href = item.href}
                                >
                                    Buka
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button 
                                className="w-full" 
                                onClick={() => window.location.href = '/accounting/cash-flows'}
                            >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Tambah Cash Flow
                            </Button>
                            <Button 
                                className="w-full" 
                                variant="outline"
                                onClick={() => window.location.href = '/accounting/payments'}
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Tambah Pembayaran
                            </Button>
                            <Button 
                                className="w-full" 
                                variant="outline"
                                onClick={() => window.location.href = '/accounting/reports/cash-flow'}
                            >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Lihat Laporan
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
