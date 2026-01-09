import PageTitle from '@/components/page-title';
import { usePermission } from '@/hooks/use-permission';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeftRight,
    BookOpen,
    Building2,
    CreditCard,
    DollarSign,
    Package,
    Percent,
    Receipt,
    Scale,
    TrendingDown,
    TrendingUp,
    Trophy,
    Users,
    Warehouse,
    Zap,
} from 'lucide-react';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '#' },
];

const reports = [
    {
        id: 'sale-report',
        title: 'Laporan Penjualan',
        description:
            'Laporan penjualan harian/bulanan dengan ringkasan per customer',
        href: '/reports/sale-report',
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        permission: 'reports.view',
    },
    {
        id: 'purchase-report',
        title: 'Laporan Pembelian',
        description:
            'Laporan pembelian harian/bulanan dengan ringkasan per supplier',
        href: '/reports/purchase-report',
        icon: TrendingDown,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        permission: 'reports.view',
    },
    {
        id: 'receivable-aging',
        title: 'Laporan Piutang Usaha',
        description:
            'Analisis aging piutang dengan kategori 0-30, 31-60, 61-90, >90 hari',
        href: '/reports/receivable-aging',
        icon: DollarSign,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        permission: 'reports.view',
    },
    {
        id: 'payable-aging',
        title: 'Laporan Hutang Usaha',
        description:
            'Analisis aging hutang dengan kategori 0-30, 31-60, 61-90, >90 hari',
        href: '/reports/payable-aging',
        icon: CreditCard,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        permission: 'reports.view',
    },
    {
        id: 'inventory-valuation',
        title: 'Laporan Nilai Persediaan',
        description:
            'Nilai persediaan saat ini berdasarkan stok dan harga rata-rata',
        href: '/reports/inventory-valuation',
        icon: Warehouse,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        permission: 'reports.view',
    },
    {
        id: 'cash-flow',
        title: 'Laporan Arus Kas',
        description: 'Laporan arus kas masuk dan keluar per periode',
        href: '/reports/cash-flow',
        icon: ArrowLeftRight,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        permission: 'reports.view',
    },
    {
        id: 'sale-by-customer',
        title: 'Laporan Penjualan per Customer',
        description: 'Analisis penjualan per customer dengan profit margin',
        href: '/reports/sale-by-customer',
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        permission: 'reports.view',
    },
    {
        id: 'sale-by-item',
        title: 'Laporan Penjualan per Item',
        description: 'Analisis penjualan per item dengan quantity dan profit',
        href: '/reports/sale-by-item',
        icon: Package,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        permission: 'reports.view',
    },
    {
        id: 'purchase-by-supplier',
        title: 'Laporan Pembelian per Supplier',
        description: 'Analisis pembelian per supplier dengan total transaksi',
        href: '/reports/purchase-by-supplier',
        icon: Building2,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        permission: 'reports.view',
    },
    {
        id: 'stock-min-max',
        title: 'Laporan Stok Minimum/Maksimum',
        description: 'Item dengan stok rendah, tinggi, dan tanpa stok',
        href: '/reports/stock-min-max',
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        permission: 'reports.view',
    },
    {
        id: 'balance-sheet',
        title: 'Laporan Neraca',
        description: 'Laporan neraca dengan aktiva, kewajiban, dan ekuitas',
        href: '/reports/balance-sheet',
        icon: Scale,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        permission: 'reports.view',
    },
    {
        id: 'sale-return',
        title: 'Laporan Retur Penjualan',
        description:
            'Ringkasan retur penjualan per periode dengan analisis per customer',
        href: '/reports/sale-return',
        icon: Receipt,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        permission: 'reports.view',
    },
    {
        id: 'purchase-return',
        title: 'Laporan Retur Pembelian',
        description:
            'Ringkasan retur pembelian per periode dengan analisis per supplier',
        href: '/reports/purchase-return',
        icon: Receipt,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        permission: 'reports.view',
    },
    {
        id: 'sale-payment',
        title: 'Laporan Pembayaran Penjualan',
        description:
            'Detail pembayaran penjualan dengan analisis per metode dan bank',
        href: '/reports/sale-payment',
        icon: CreditCard,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        permission: 'reports.view',
    },
    {
        id: 'purchase-payment',
        title: 'Laporan Pembayaran Pembelian',
        description:
            'Detail pembayaran pembelian dengan analisis per metode dan bank',
        href: '/reports/purchase-payment',
        icon: CreditCard,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        permission: 'reports.view',
    },
    {
        id: 'cash-in-out',
        title: 'Laporan Kas Masuk/Keluar',
        description:
            'Ringkasan kas masuk dan keluar dengan analisis per bank dan akun',
        href: '/reports/cash-in-out',
        icon: ArrowLeftRight,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
        permission: 'reports.view',
    },
    {
        id: 'best-seller',
        title: 'Laporan Barang Paling Laku',
        description:
            'Ranking item terlaris berdasarkan quantity/revenue dengan tren penjualan',
        href: '/reports/best-seller',
        icon: Trophy,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        permission: 'reports.view',
    },
    {
        id: 'dead-stock',
        title: 'Laporan Barang Paling Tidak Laku',
        description:
            'Item yang tidak terjual dalam periode tertentu dengan nilai persediaan menganggur',
        href: '/reports/dead-stock',
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        permission: 'reports.view',
    },
    {
        id: 'stock-turnover',
        title: 'Laporan Perputaran Stok',
        description:
            'Analisis perputaran stok per item untuk identifikasi item cepat/lambat bergerak',
        href: '/reports/stock-turnover',
        icon: Zap,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        permission: 'reports.view',
    },
    {
        id: 'margin-by-item',
        title: 'Laporan Analisis Margin per Item',
        description:
            'Margin/profit per item dengan rekomendasi pricing untuk item paling/terkurang profitable',
        href: '/reports/margin-by-item',
        icon: Percent,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        permission: 'reports.view',
    },
    {
        id: 'margin-by-customer',
        title: 'Laporan Analisis Margin per Customer',
        description:
            'Margin/profit per customer untuk strategi pricing per customer paling/terkurang profitable',
        href: '/reports/margin-by-customer',
        icon: Percent,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        permission: 'reports.view',
    },
    {
        id: 'binder',
        title: 'Laporan Binder',
        description:
            'Laporan arsip penjualan per 10 transaksi (10 MJ) untuk keperluan binder',
        href: '/reports/binder',
        icon: BookOpen,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        permission: 'reports.binder',
    },
];

const ReportsIndex = () => {
    const { hasPermission } = usePermission();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan" />
            <div className="mb-6 flex items-center justify-between">
                <PageTitle title="Laporan" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => {
                    const Icon = report.icon;
                    if (!hasPermission(report.permission)) return null;

                    return (
                        <Link key={report.id} href={report.href}>
                            <Card className="content h-full cursor-pointer transition-shadow hover:shadow-lg">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`rounded-lg p-3 ${report.bgColor}`}
                                        >
                                            <Icon
                                                className={`h-6 w-6 ${report.color}`}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">
                                                {report.title}
                                            </CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-sm">
                                        {report.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </AppLayout>
    );
};

export default ReportsIndex;
