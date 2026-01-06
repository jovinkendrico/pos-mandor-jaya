import { DatePicker } from '@/components/date-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { PurchaseStatus, SaleStatus } from '@/constants/enum';
import AppLayout from '@/layouts/app-layout';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { dashboard } from '@/routes';
import { create as createPurchasePayment } from '@/routes/purchase-payments';
import { create as createPurchaseReturn } from '@/routes/purchase-returns';
import { create as createPurchase } from '@/routes/purchases';
import { create as createSalePayment } from '@/routes/sale-payments';
import { create as createSaleReturn } from '@/routes/sale-returns';
import { create as createSale } from '@/routes/sales';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowDownRight,
    ArrowLeftRight,
    ArrowUpRight,
    BarChart3,
    Box,
    Calendar,
    Clock,
    CreditCard,
    DollarSign,
    Package,
    RotateCcw,
    Search,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
    Truck,
    Users,
    Wallet,
    Wallet2,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface Stats {
    sales: {
        today: number;
        period: number;
        previousPeriod: number;
        growth: number;
    };
    purchases: {
        today: number;
        period: number;
        previousPeriod: number;
        growth: number;
    };
    profit: {
        today: number;
        period: number;
        marginPercent: number;
    };
    payments: {
        receivables: number;
        payables: number;
        todaySalePayments: number;
        todayPurchasePayments: number;
        avgDaysToPay: number;
        overdueAmount: number;
    };
    bankBalance: number;
    transactions: {
        todaySaleCount: number;
        periodSaleCount: number;
        todayPurchaseCount: number;
        periodPurchaseCount: number;
        avgSaleValue: number;
        avgPurchaseValue: number;
    };
    inventoryValue: number;
    returnRate: number;
}

interface Period {
    date_from: string;
    date_to: string;
}

interface Bank {
    id: number;
    name: string;
    type: 'bank' | 'cash';
    balance: number;
}

interface LowStockItem {
    id: number;
    name: string;
    stock: number;
}

interface RecentSale {
    id: number;
    sale_number: string;
    customer?: { name: string };
    sale_date: string;
    total_amount: string;
    status: 'pending' | 'confirmed';
}

interface RecentPurchase {
    id: number;
    purchase_number: string;
    supplier?: { name: string };
    purchase_date: string;
    total_amount: string;
    status: 'pending' | 'confirmed';
}

interface SaleDueSoon {
    id: number;
    sale_number: string;
    customer?: { name: string };
    sale_date: string;
    due_date: string;
    total_amount: number;
    total_paid: number;
    remaining_amount: number;
    status: 'pending' | 'confirmed';
}

interface PurchaseDueSoon {
    id: number;
    purchase_number: string;
    supplier?: { name: string };
    purchase_date: string;
    due_date: string;
    total_amount: number;
    total_paid: number;
    remaining_amount: number;
    status: 'pending' | 'confirmed';
}

interface TopSellingItem {
    id: number;
    name: string;
    total_quantity: number;
    total_revenue: number;
    total_profit: number;
}

interface TopCustomer {
    customer: {
        id: number;
        name: string;
    } | null;
    total_sales: number;
    transaction_count: number;
}

interface CriticalStockItem {
    id: number;
    name: string;
    stock: number;
}

interface DeadStockItem {
    id: number;
    name: string;
    stock: number;
    days_since_last_sale: number | null;
}

interface TopSupplier {
    supplier: {
        id: number;
        name: string;
    } | null;
    total_purchases: number;
    transaction_count: number;
}

interface OverdueSale {
    id: number;
    sale_number: string;
    customer?: { name: string };
    sale_date: string;
    due_date: string;
    total_amount: number;
    total_paid: number;
    remaining_amount: number;
    days_overdue: number;
    status: 'pending' | 'confirmed';
}

interface PageProps {
    period: Period;
    stats: Stats;
    banks: Bank[];
    lowStockItems: LowStockItem[];
    criticalStockItems: CriticalStockItem[];
    deadStockItems: DeadStockItem[];
    recentSales: RecentSale[];
    recentPurchases: RecentPurchase[];
    salesDueSoon: SaleDueSoon[];
    overdueSales: OverdueSale[];
    purchasesDueSoon: PurchaseDueSoon[];
    topSellingItems: TopSellingItem[];
    topCustomers: TopCustomer[];
    topSuppliers: TopSupplier[];
    unconfirmed: {
        sales: {
            count: number;
            amount: number;
        };
        purchases: {
            count: number;
            amount: number;
        };
    };
}

export default function Dashboard({
    period,
    stats,
    banks,
    lowStockItems,
    criticalStockItems,
    deadStockItems,
    recentSales,
    recentPurchases,
    salesDueSoon,
    overdueSales,
    purchasesDueSoon,
    topSellingItems,
    topCustomers,
    topSuppliers,
    unconfirmed,
}: PageProps) {
    const [filters, setFilters] = useState({
        date_from: period.date_from,
        date_to: period.date_to,
    });

    const handleFilter = () => {
        router.get('/dashboard', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    useEffect(() => {
        setFilters({
            date_from: period.date_from,
            date_to: period.date_to,
        });
    }, [period.date_from, period.date_to]);

    const formatPeriod = () => {
        if (!filters.date_from || !filters.date_to) return 'Bulan Ini';
        const from = new Date(filters.date_from);
        const to = new Date(filters.date_to);
        const fromMonth = from.toLocaleDateString('id-ID', { month: 'long' });
        const toMonth = to.toLocaleDateString('id-ID', { month: 'long' });
        const year = from.getFullYear();

        if (fromMonth === toMonth && from.getFullYear() === to.getFullYear()) {
            return `${fromMonth} ${year}`;
        }
        return `${fromMonth} - ${toMonth} ${year}`;
    };

    const StatCard = ({
        title,
        value,
        description,
        icon: Icon,
        trend,
        trendValue,
    }: {
        title: string;
        value: string;
        description?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        icon: any;
        trend?: 'up' | 'down';
        trendValue?: number;
        className?: string;
    }) => (
        <Card className="content">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                        {trend && trendValue !== undefined && (
                            <span
                                className={`ml-2 inline-flex items-center ${trend === 'up' ? 'text-green-600 dark:text-emerald-500' : 'text-red-600 dark:text-danger-500'}`}
                            >
                                {trend === 'up' ? (
                                    <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3" />
                                )}
                                {Math.abs(trendValue).toFixed(1)}%
                            </span>
                        )}
                    </p>
                )}
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            Dashboard
                        </h2>
                        <p className="mt-1 text-muted-foreground">
                            Ringkasan bisnis Anda - {formatPeriod()}
                        </p>
                    </div>
                </div>

                {/* Period Filter */}
                <Card className="content">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Calendar className="h-4 w-4" />
                            Filter Periode
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="date_from">Dari Tanggal</Label>
                                <DatePicker
                                    value={
                                        filters.date_from
                                            ? new Date(filters.date_from)
                                            : undefined
                                    }
                                    onChange={(date) =>
                                        setFilters({
                                            ...filters,
                                            date_from: date
                                                ? format(date, 'yyyy-MM-dd')
                                                : '',
                                        })
                                    }
                                    className="input-box"
                                />
                            </div>
                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="date_to">Sampai Tanggal</Label>
                                <DatePicker
                                    value={
                                        filters.date_to
                                            ? new Date(filters.date_to)
                                            : undefined
                                    }
                                    onChange={(date) =>
                                        setFilters({
                                            ...filters,
                                            date_to: date
                                                ? format(date, 'yyyy-MM-dd')
                                                : '',
                                        })
                                    }
                                    className="input-box"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button
                                    onClick={handleFilter}
                                    className="btn-primary"
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    Tampilkan
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        const now = new Date();
                                        const startOfMonth = new Date(
                                            now.getFullYear(),
                                            now.getMonth(),
                                            1,
                                        );
                                        const endOfMonth = new Date(
                                            now.getFullYear(),
                                            now.getMonth() + 1,
                                            0,
                                        );
                                        setFilters({
                                            date_from: format(
                                                startOfMonth,
                                                'yyyy-MM-dd',
                                            ),
                                            date_to: format(
                                                endOfMonth,
                                                'yyyy-MM-dd',
                                            ),
                                        });
                                    }}
                                    className="btn-secondary"
                                >
                                    Bulan Ini
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions - Compact */}
                <Card className="content">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                            <Button
                                variant="outline"
                                className="input-box flex h-20 cursor-pointer flex-col items-center justify-center gap-1.5 hover:bg-accent dark:hover:bg-primary-800/10"
                                onClick={() => router.visit(createSale().url)}
                            >
                                <ShoppingCart className="!h-7 !w-7 text-blue-600 dark:text-blue-500" />
                                <span className="text-xl">Penjualan</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="input-box flex h-20 cursor-pointer flex-col items-center justify-center gap-1.5 hover:bg-accent dark:hover:bg-primary-800/10"
                                onClick={() =>
                                    router.visit(createPurchase().url)
                                }
                            >
                                <Package className="!h-7 !w-7 text-yellow-600 dark:text-yellow-300" />
                                <span className="text-xs lg:text-xl">
                                    Pembelian
                                </span>
                            </Button>
                            <Button
                                variant="outline"
                                className="input-box flex h-20 cursor-pointer flex-col items-center justify-center gap-1.5 hover:bg-accent dark:hover:bg-primary-800/10"
                                onClick={() =>
                                    router.visit(createSalePayment().url)
                                }
                            >
                                <CreditCard className="!h-7 !w-7 text-green-600 dark:text-emerald-500" />
                                <span className="text-xs lg:text-xl">
                                    Bayar Jual
                                </span>
                            </Button>
                            <Button
                                variant="outline"
                                className="input-box flex h-20 cursor-pointer flex-col items-center justify-center gap-1.5 hover:bg-accent dark:hover:bg-primary-800/10"
                                onClick={() =>
                                    router.visit(createPurchasePayment().url)
                                }
                            >
                                <CreditCard className="!h-7 !w-7 text-red-600 dark:text-danger-500" />
                                <span className="text-xs lg:text-xl">
                                    Bayar Beli
                                </span>
                            </Button>
                            <Button
                                variant="outline"
                                className="input-box flex h-20 cursor-pointer flex-col items-center justify-center gap-1.5 hover:bg-accent dark:hover:bg-primary-800/10"
                                onClick={() =>
                                    router.visit(createSaleReturn().url)
                                }
                            >
                                <ArrowLeftRight className="!h-7 !w-7 text-purple-600 dark:text-purple-500" />
                                <span className="text-xs lg:text-xl">
                                    Retur Jual
                                </span>
                            </Button>
                            <Button
                                variant="outline"
                                className="input-box flex h-20 cursor-pointer flex-col items-center justify-center gap-1.5 hover:bg-accent dark:hover:bg-primary-800/10"
                                onClick={() =>
                                    router.visit(createPurchaseReturn().url)
                                }
                            >
                                <ArrowLeftRight className="!h-7 !w-7 text-orange-600 dark:text-amber-500" />
                                <span className="text-xs lg:text-xl">
                                    Retur Beli
                                </span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Unconfirmed Transactions Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="content border-yellow-200 bg-yellow-50/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Penjualan Belum Konfirmasi
                            </CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(unconfirmed.sales.amount)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {unconfirmed.sales.count} Transaksi pending
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="content border-yellow-200 bg-yellow-50/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Pembelian Belum Konfirmasi
                            </CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(unconfirmed.purchases.amount)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {unconfirmed.purchases.count} Transaksi pending
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Financial Overview */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title={`Penjualan ${formatPeriod()}`}
                        value={formatCurrency(stats.sales.period)}
                        description={`Hari ini: ${formatCurrency(stats.sales.today)}`}
                        icon={ShoppingCart}
                        trend={stats.sales.growth >= 0 ? 'up' : 'down'}
                        trendValue={stats.sales.growth}
                    />
                    <StatCard
                        title={`Pembelian ${formatPeriod()}`}
                        value={formatCurrency(stats.purchases.period)}
                        description={`Hari ini: ${formatCurrency(stats.purchases.today)}`}
                        icon={Package}
                        trend={stats.purchases.growth >= 0 ? 'up' : 'down'}
                        trendValue={stats.purchases.growth}
                    />
                    <StatCard
                        title={`Profit ${formatPeriod()}`}
                        value={formatCurrency(stats.profit.period)}
                        description={`Margin: ${stats.profit.marginPercent.toFixed(1)}%`}
                        icon={DollarSign}
                    />
                    <StatCard
                        title="Nilai Inventori"
                        value={formatCurrency(stats.inventoryValue)}
                        description="Total nilai stok"
                        icon={Box}
                    />
                </div>

                {/* Financial & Operations Summary */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="content">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Piutang
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.payments.receivables)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Rata: {stats.payments.avgDaysToPay} hari
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="content">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Hutang
                            </CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.payments.payables)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Belum dibayar
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="content">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Cash Flow Hari Ini
                            </CardTitle>
                            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold ${stats.payments.todaySalePayments - stats.payments.todayPurchasePayments >= 0 ? 'text-green-600 dark:text-emerald-500' : 'text-red-600 dark:text-danger-500'}`}
                            >
                                {formatCurrency(
                                    stats.payments.todaySalePayments -
                                    stats.payments.todayPurchasePayments,
                                )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Masuk:{' '}
                                {formatCurrency(
                                    stats.payments.todaySalePayments,
                                )}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="content">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Saldo Bank
                            </CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.bankBalance)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {banks.length} bank/kas
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Alerts & Warnings */}
                {(criticalStockItems.length > 0 ||
                    overdueSales.length > 0 ||
                    stats.payments.overdueAmount > 0) && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {criticalStockItems.length > 0 && (
                                <Card className="border-red-200 bg-red-50/50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-danger-500" />
                                            Stok Kritis ({criticalStockItems.length}
                                            )
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-h-32 space-y-1.5 overflow-y-auto">
                                            {criticalStockItems
                                                .slice(0, 3)
                                                .map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between text-sm"
                                                    >
                                                        <span className="flex-1 truncate">
                                                            {item.name}
                                                        </span>
                                                        <Badge
                                                            variant="destructive"
                                                            className="ml-2 text-xs"
                                                        >
                                                            {item.stock}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            {criticalStockItems.length > 3 && (
                                                <p className="pt-1 text-xs text-muted-foreground">
                                                    +{criticalStockItems.length - 3}{' '}
                                                    lainnya
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {overdueSales.length > 0 && (
                                <Card className="border-red-900 bg-red-500/30">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <XCircle className="h-4 w-4 text-red-600 dark:text-danger-500" />
                                            Piutang Terlambat ({overdueSales.length}
                                            )
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-h-32 space-y-1.5 overflow-y-auto">
                                            {overdueSales
                                                .slice(0, 3)
                                                .map((sale) => (
                                                    <div
                                                        key={sale.id}
                                                        className="flex items-center justify-between text-sm"
                                                    >
                                                        <div className="w-full">
                                                            <p className="flex-1 truncate">
                                                                {sale.sale_number}
                                                            </p>
                                                        </div>
                                                        <div className="ml-2 flex w-full items-center justify-between px-2">
                                                            <Badge className="badge-red-light text-left text-xs">
                                                                {formatNumber(
                                                                    sale.days_overdue,
                                                                )}{' '}
                                                                hari
                                                            </Badge>
                                                            <p className="text-right text-xs font-medium">
                                                                {formatCurrency(
                                                                    sale.remaining_amount,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            {overdueSales.length > 3 && (
                                                <p className="pt-1 text-xs text-muted-foreground">
                                                    +{overdueSales.length - 3}{' '}
                                                    lainnya
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {stats.returnRate > 2 && (
                                <Card
                                    className={
                                        stats.returnRate > 5
                                            ? 'border-red-200 bg-red-50/50'
                                            : 'border-orange-200 bg-orange-50/50'
                                    }
                                >
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <RotateCcw
                                                className={`h-4 w-4 ${stats.returnRate > 5 ? 'text-red-600 dark:text-danger-500' : 'text-orange-600 dark:text-amber-500'}`}
                                            />
                                            Tingkat Retur
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            className={`text-2xl font-bold ${stats.returnRate > 5 ? 'text-red-600 dark:text-danger-500' : 'text-orange-600 dark:text-amber-500'}`}
                                        >
                                            {stats.returnRate.toFixed(2)}%
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Retur penjualan {formatPeriod()}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                {/* Business Insights - 3 Column Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Top Selling Items */}
                    <Card className="content">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 className="h-4 w-4 text-blue-500" />
                                Barang Terlaris
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Top 5 {formatPeriod()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topSellingItems.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Tidak ada data
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {topSellingItems
                                        .slice(0, 5)
                                        .map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="input-box flex items-center justify-between rounded-md border p-2 hover:bg-muted/50"
                                            >
                                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                                    <span className="w-4 text-xs font-bold text-muted-foreground">
                                                        {index + 1}.
                                                    </span>
                                                    <p className="truncate text-sm font-medium">
                                                        {item.name}
                                                    </p>
                                                </div>
                                                <div className="ml-2 text-right">
                                                    <p className="text-xs font-medium">
                                                        {formatCurrency(
                                                            item.total_revenue,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Qty:{' '}
                                                        {item.total_quantity.toFixed(
                                                            0,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Customers */}
                    <Card className="content">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="h-4 w-4 text-green-600 dark:text-emerald-500" />
                                Pelanggan Teratas
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Top 5 {formatPeriod()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topCustomers.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Tidak ada data
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {topCustomers.map((customer, index) => (
                                        <div
                                            key={customer.customer?.id || index}
                                            className="input-box flex items-center justify-between rounded-md border p-2 hover:bg-muted/50"
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                <span className="w-4 text-xs font-bold text-muted-foreground">
                                                    {index + 1}.
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {customer.customer
                                                            ?.name ||
                                                            'No Customer'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {
                                                            customer.transaction_count
                                                        }{' '}
                                                        transaksi
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="ml-2 text-sm font-bold">
                                                {formatCurrency(
                                                    customer.total_sales,
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Suppliers */}
                    <Card className="content">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Truck className="h-4 w-4 text-blue-500" />
                                Supplier Teratas
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Top 5 {formatPeriod()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topSuppliers.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Tidak ada data
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {topSuppliers.map((supplier, index) => (
                                        <div
                                            key={supplier.supplier?.id || index}
                                            className="input-box flex items-center justify-between rounded-md border p-2 hover:bg-muted/50"
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                <span className="w-4 text-xs font-bold text-muted-foreground">
                                                    {index + 1}.
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {supplier.supplier
                                                            ?.name ||
                                                            'No Supplier'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {
                                                            supplier.transaction_count
                                                        }{' '}
                                                        transaksi
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="ml-2 text-sm font-bold">
                                                {formatCurrency(
                                                    supplier.total_purchases,
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Inventory & Stock Management */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Low Stock Items */}
                    {(lowStockItems.length > 0 ||
                        criticalStockItems.length > 0) && (
                            <Card className="content">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                                        Stok Menipis
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Stok ≤ 10
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {lowStockItems.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            Tidak ada
                                        </p>
                                    ) : (
                                        <div className="max-h-48 space-y-1.5 overflow-y-auto">
                                            {lowStockItems
                                                .slice(0, 8)
                                                .map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between rounded border p-1.5 text-sm"
                                                    >
                                                        <span className="flex-1 truncate">
                                                            {item.name}
                                                        </span>
                                                        <Badge
                                                            className={cn(
                                                                item.stock <= 5
                                                                    ? 'badge-red-light'
                                                                    : 'badge-yellow-light',
                                                                'ml-2 text-xs',
                                                            )}
                                                        >
                                                            {item.stock}
                                                        </Badge>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                    {/* Dead Stock */}
                    {deadStockItems.length > 0 && (
                        <Card className="content">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Clock className="h-4 w-4 text-teal-600 dark:text-teal-500" />
                                    Stok Tidak Bergerak
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Tidak terjual 90+ hari
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-48 space-y-1.5 overflow-y-auto">
                                    {deadStockItems.slice(0, 8).map((item) => (
                                        <div
                                            key={item.id}
                                            className="input-box rounded-md border p-1.5 text-sm hover:bg-muted/50"
                                        >
                                            <p className="truncate font-medium">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Stok: {item.stock.toFixed(0)} •{' '}
                                                {item.days_since_last_sale !==
                                                    null
                                                    ? `${item.days_since_last_sale} hari lalu`
                                                    : 'Belum pernah'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Bank Balances */}
                    <Card className="content">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Wallet2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                Saldo Bank/Kas
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Total: {formatCurrency(stats.bankBalance)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-48 space-y-1.5 overflow-y-auto">
                                {banks.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Tidak ada bank/kas
                                    </p>
                                ) : (
                                    banks.map((bank) => (
                                        <div
                                            key={bank.id}
                                            className="input-box flex items-center justify-between rounded-md border p-1.5 text-sm hover:bg-muted/50"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {bank.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {bank.type}
                                                </p>
                                            </div>
                                            <p className="font-bold">
                                                {formatCurrency(bank.balance)}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Due Dates */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Overdue Sales */}
                    {overdueSales.length > 0 && (
                        <Card className="content">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <XCircle className="h-4 w-4 text-red-600 dark:text-danger-500" />
                                    Piutang Terlambat
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Total:{' '}
                                    {formatCurrency(
                                        stats.payments.overdueAmount,
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="input-box overflow-x-auto rounded-lg">
                                    <Table className="content">
                                        <TableHeader>
                                            <TableRow className="dark:border-b-2 dark:border-white/25">
                                                <TableHead className="h-8 text-xs">
                                                    No. Penjualan
                                                </TableHead>
                                                <TableHead className="h-8 text-xs">
                                                    Terlambat
                                                </TableHead>
                                                <TableHead className="h-8 text-right text-xs">
                                                    Sisa
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {overdueSales
                                                .slice(0, 5)
                                                .map((sale) => (
                                                    <TableRow
                                                        key={sale.id}
                                                        className="cursor-pointer dark:border-b-2 dark:border-white/25"
                                                        onClick={() =>
                                                            router.visit(
                                                                `/sales/${sale.id}`,
                                                            )
                                                        }
                                                    >
                                                        <TableCell className="text-xs font-medium">
                                                            {sale.sale_number}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className="badge-red-light text-xs">
                                                                {Math.floor(
                                                                    sale.days_overdue,
                                                                )}{' '}
                                                                hari
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs font-medium text-red-600 dark:text-danger-500">
                                                            {formatCurrency(
                                                                sale.remaining_amount,
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sales Due Soon */}
                    {salesDueSoon.length > 0 && (
                        <Card className="content">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-amber-500" />
                                    Jatuh Tempo (30 hari)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Penjualan
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="input-box overflow-x-auto rounded-lg">
                                    <Table className="content">
                                        <TableHeader>
                                            <TableRow className="dark:border-b-2 dark:border-white/25">
                                                <TableHead className="h-8 text-xs">
                                                    No. Penjualan
                                                </TableHead>
                                                <TableHead className="h-8 text-xs">
                                                    Jatuh Tempo
                                                </TableHead>
                                                <TableHead className="h-8 text-right text-xs">
                                                    Sisa
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {salesDueSoon
                                                .slice(0, 5)
                                                .map((sale) => {
                                                    const daysUntilDue =
                                                        Math.ceil(
                                                            (new Date(
                                                                sale.due_date,
                                                            ).getTime() -
                                                                new Date().getTime()) /
                                                            (1000 *
                                                                60 *
                                                                60 *
                                                                24),
                                                        );
                                                    const isDueSoon =
                                                        daysUntilDue <= 7 &&
                                                        daysUntilDue >= 0;

                                                    return (
                                                        <TableRow
                                                            key={sale.id}
                                                            className="cursor-pointer dark:border-b-2 dark:border-white/25"
                                                            onClick={() =>
                                                                router.visit(
                                                                    `/sales/${sale.id}`,
                                                                )
                                                            }
                                                        >
                                                            <TableCell className="text-xs font-medium">
                                                                {
                                                                    sale.sale_number
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-xs">
                                                                        {formatDate(
                                                                            sale.due_date,
                                                                        )}
                                                                    </span>
                                                                    {isDueSoon && (
                                                                        <Badge className="badge-yellow-light text-center text-xs">
                                                                            {
                                                                                daysUntilDue
                                                                            }{' '}
                                                                            hari
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right text-xs font-medium">
                                                                {formatCurrency(
                                                                    sale.remaining_amount,
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Purchases Due Soon */}
                    {purchasesDueSoon.length > 0 && (
                        <Card className="content">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-amber-500" />
                                    Jatuh Tempo (30 hari)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Pembelian
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="input-box overflow-x-auto rounded-lg">
                                    <Table className="content">
                                        <TableHeader>
                                            <TableRow className="dark:border-b-2 dark:border-white/25">
                                                <TableHead className="h-8 text-xs">
                                                    No. Pembelian
                                                </TableHead>
                                                <TableHead className="h-8 text-xs">
                                                    Jatuh Tempo
                                                </TableHead>
                                                <TableHead className="h-8 text-right text-xs">
                                                    Sisa
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {purchasesDueSoon
                                                .slice(0, 5)
                                                .map((purchase) => {
                                                    const daysUntilDue =
                                                        Math.ceil(
                                                            (new Date(
                                                                purchase.due_date,
                                                            ).getTime() -
                                                                new Date().getTime()) /
                                                            (1000 *
                                                                60 *
                                                                60 *
                                                                24),
                                                        );
                                                    const isDueSoon =
                                                        daysUntilDue <= 7 &&
                                                        daysUntilDue >= 0;

                                                    return (
                                                        <TableRow
                                                            key={purchase.id}
                                                            className="cursor-pointer dark:border-b-2 dark:border-white/25"
                                                            onClick={() =>
                                                                router.visit(
                                                                    `/purchases/${purchase.id}`,
                                                                )
                                                            }
                                                        >
                                                            <TableCell className="text-xs font-medium">
                                                                {
                                                                    purchase.purchase_number
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-xs">
                                                                        {formatDate(
                                                                            purchase.due_date,
                                                                        )}
                                                                    </span>
                                                                    {isDueSoon && (
                                                                        <Badge className="badge-yellow-light text-center text-xs">
                                                                            {
                                                                                daysUntilDue
                                                                            }{' '}
                                                                            hari
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right text-xs font-medium">
                                                                {formatCurrency(
                                                                    purchase.remaining_amount,
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Recent Activity */}
                {(recentSales.length > 0 || recentPurchases.length > 0) && (
                    <Card className="content">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Activity className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                                Aktivitas Terbaru
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2 md:grid-cols-2">
                                {recentSales.slice(0, 3).map((sale) => (
                                    <div
                                        key={`sale-${sale.id}`}
                                        className="input-box flex cursor-pointer items-center justify-between rounded-md border p-2 hover:bg-muted/50"
                                        onClick={() =>
                                            router.visit(`/sales/${sale.id}`)
                                        }
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {sale.sale_number}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {sale.customer?.name ||
                                                    'No Customer'}{' '}
                                                • {formatDate(sale.sale_date)}
                                            </p>
                                        </div>
                                        <div className="ml-2 text-right">
                                            <p className="text-sm font-bold">
                                                {formatCurrency(
                                                    Number(sale.total_amount),
                                                )}
                                            </p>
                                            <Badge
                                                className={cn(
                                                    'text-xs',
                                                    sale.status ===
                                                        SaleStatus.CONFIRMED
                                                        ? 'badge-green-light'
                                                        : 'badge-yellow-light',
                                                )}
                                            >
                                                {sale.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {recentPurchases.slice(0, 3).map((purchase) => (
                                    <div
                                        key={`purchase-${purchase.id}`}
                                        className="input-box flex cursor-pointer items-center justify-between rounded-md border p-2 hover:bg-muted/50"
                                        onClick={() =>
                                            router.visit(
                                                `/purchases/${purchase.id}`,
                                            )
                                        }
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {purchase.purchase_number}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {purchase.supplier?.name ||
                                                    'No Supplier'}{' '}
                                                •{' '}
                                                {formatDate(
                                                    purchase.purchase_date,
                                                )}
                                            </p>
                                        </div>
                                        <div className="ml-2 text-right">
                                            <p className="text-sm font-bold">
                                                {formatCurrency(
                                                    Number(
                                                        purchase.total_amount,
                                                    ),
                                                )}
                                            </p>
                                            <Badge
                                                className={cn(
                                                    'text-xs',
                                                    purchase.status ===
                                                        PurchaseStatus.CONFIRMED
                                                        ? 'badge-green-light'
                                                        : 'badge-yellow-light',
                                                )}
                                            >
                                                {purchase.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
