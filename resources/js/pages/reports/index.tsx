import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageTitle from '@/components/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    FileText,
    TrendingUp,
    TrendingDown,
    Users,
    Package,
    ShoppingCart,
    CreditCard,
    DollarSign,
    BarChart3,
    AlertTriangle,
    Receipt,
    ArrowLeftRight,
    Building2,
    Warehouse,
    Scale,
} from 'lucide-react';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '#' },
];

const reports = [
    {
        id: 'sale-report',
        title: 'Laporan Penjualan',
        description: 'Laporan penjualan harian/bulanan dengan ringkasan per customer',
        href: '/reports/sale-report',
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
    },
    {
        id: 'purchase-report',
        title: 'Laporan Pembelian',
        description: 'Laporan pembelian harian/bulanan dengan ringkasan per supplier',
        href: '/reports/purchase-report',
        icon: TrendingDown,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
    },
    {
        id: 'receivable-aging',
        title: 'Laporan Piutang Usaha',
        description: 'Analisis aging piutang dengan kategori 0-30, 31-60, 61-90, >90 hari',
        href: '/reports/receivable-aging',
        icon: DollarSign,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
    },
    {
        id: 'payable-aging',
        title: 'Laporan Hutang Usaha',
        description: 'Analisis aging hutang dengan kategori 0-30, 31-60, 61-90, >90 hari',
        href: '/reports/payable-aging',
        icon: CreditCard,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
    },
    {
        id: 'inventory-valuation',
        title: 'Laporan Nilai Persediaan',
        description: 'Nilai persediaan saat ini berdasarkan stok dan harga rata-rata',
        href: '/reports/inventory-valuation',
        icon: Warehouse,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
    },
    {
        id: 'cash-flow',
        title: 'Laporan Arus Kas',
        description: 'Laporan arus kas masuk dan keluar per periode',
        href: '/reports/cash-flow',
        icon: ArrowLeftRight,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
    },
    {
        id: 'sale-by-customer',
        title: 'Laporan Penjualan per Customer',
        description: 'Analisis penjualan per customer dengan profit margin',
        href: '/reports/sale-by-customer',
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
    },
    {
        id: 'sale-by-item',
        title: 'Laporan Penjualan per Item',
        description: 'Analisis penjualan per item dengan quantity dan profit',
        href: '/reports/sale-by-item',
        icon: Package,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
    },
    {
        id: 'purchase-by-supplier',
        title: 'Laporan Pembelian per Supplier',
        description: 'Analisis pembelian per supplier dengan total transaksi',
        href: '/reports/purchase-by-supplier',
        icon: Building2,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
    },
    {
        id: 'stock-min-max',
        title: 'Laporan Stok Minimum/Maksimum',
        description: 'Item dengan stok rendah, tinggi, dan tanpa stok',
        href: '/reports/stock-min-max',
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
    },
    {
        id: 'balance-sheet',
        title: 'Laporan Neraca',
        description: 'Laporan neraca dengan aktiva, kewajiban, dan ekuitas',
        href: '/reports/balance-sheet',
        icon: Scale,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
    },
    {
        id: 'sale-return',
        title: 'Laporan Retur Penjualan',
        description: 'Ringkasan retur penjualan per periode dengan analisis per customer',
        href: '/reports/sale-return',
        icon: Receipt,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
    },
    {
        id: 'purchase-return',
        title: 'Laporan Retur Pembelian',
        description: 'Ringkasan retur pembelian per periode dengan analisis per supplier',
        href: '/reports/purchase-return',
        icon: Receipt,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
    },
    {
        id: 'sale-payment',
        title: 'Laporan Pembayaran Penjualan',
        description: 'Detail pembayaran penjualan dengan analisis per metode dan bank',
        href: '/reports/sale-payment',
        icon: CreditCard,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
    },
    {
        id: 'purchase-payment',
        title: 'Laporan Pembayaran Pembelian',
        description: 'Detail pembayaran pembelian dengan analisis per metode dan bank',
        href: '/reports/purchase-payment',
        icon: CreditCard,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
    },
    {
        id: 'cash-in-out',
        title: 'Laporan Kas Masuk/Keluar',
        description: 'Ringkasan kas masuk dan keluar dengan analisis per bank dan akun',
        href: '/reports/cash-in-out',
        icon: ArrowLeftRight,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
    },
];

export default function ReportsIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan" />
            <div className="flex justify-between items-center mb-6">
                <PageTitle title="Laporan" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => {
                    const Icon = report.icon;
                    return (
                        <Link key={report.id} href={report.href}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-lg ${report.bgColor}`}>
                                            <Icon className={`h-6 w-6 ${report.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{report.title}</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-sm">{report.description}</CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </AppLayout>
    );
}

