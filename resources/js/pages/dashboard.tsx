import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { create as createSale } from '@/routes/sales';
import { create as createPurchase } from '@/routes/purchases';
import { create as createSalePayment } from '@/routes/sale-payments';
import { create as createPurchasePayment } from '@/routes/purchase-payments';
import { create as createSaleReturn } from '@/routes/sale-returns';
import { create as createPurchaseReturn } from '@/routes/purchase-returns';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Package,
    DollarSign,
    CreditCard,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    ArrowLeftRight,
    BarChart3,
    Users,
    Box,
    AlertCircle,
    RotateCcw,
    Truck,
    Clock,
    XCircle,
    Activity,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface Stats {
    sales: {
        today: number;
        month: number;
        lastMonth: number;
        growth: number;
    };
    purchases: {
        today: number;
        month: number;
        lastMonth: number;
        growth: number;
    };
    profit: {
        today: number;
        month: number;
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
        monthSaleCount: number;
        todayPurchaseCount: number;
        monthPurchaseCount: number;
        avgSaleValue: number;
        avgPurchaseValue: number;
    };
    inventoryValue: number;
    returnRate: number;
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
}

export default function Dashboard({ stats, banks, lowStockItems, criticalStockItems, deadStockItems, recentSales, recentPurchases, salesDueSoon, overdueSales, purchasesDueSoon, topSellingItems, topCustomers, topSuppliers }: PageProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const StatCard = ({
        title,
        value,
        description,
        icon: Icon,
        trend,
        trendValue,
        className = '',
    }: {
        title: string;
        value: string;
        description?: string;
        icon: any;
        trend?: 'up' | 'down';
        trendValue?: number;
        className?: string;
    }) => (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                        {trend && trendValue !== undefined && (
                            <span className={`ml-2 inline-flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
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
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                        <p className="text-muted-foreground mt-1">Ringkasan bisnis Anda hari ini</p>
                    </div>
                </div>

                {/* Quick Actions - Compact */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-20 gap-1.5 hover:bg-accent"
                                onClick={() => router.visit(createSale().url)}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                <span className="text-xs">Penjualan</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-20 gap-1.5 hover:bg-accent"
                                onClick={() => router.visit(createPurchase().url)}
                            >
                                <Package className="h-4 w-4" />
                                <span className="text-xs">Pembelian</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-20 gap-1.5 hover:bg-accent"
                                onClick={() => router.visit(createSalePayment().url)}
                            >
                                <CreditCard className="h-4 w-4 text-green-600" />
                                <span className="text-xs">Bayar Jual</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-20 gap-1.5 hover:bg-accent"
                                onClick={() => router.visit(createPurchasePayment().url)}
                            >
                                <CreditCard className="h-4 w-4 text-red-600" />
                                <span className="text-xs">Bayar Beli</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-20 gap-1.5 hover:bg-accent"
                                onClick={() => router.visit(createSaleReturn().url)}
                            >
                                <ArrowLeftRight className="h-4 w-4" />
                                <span className="text-xs">Retur Jual</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-20 gap-1.5 hover:bg-accent"
                                onClick={() => router.visit(createPurchaseReturn().url)}
                            >
                                <ArrowLeftRight className="h-4 w-4" />
                                <span className="text-xs">Retur Beli</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Financial Overview */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Penjualan Bulan Ini"
                        value={formatCurrency(stats.sales.month)}
                        description={`Hari ini: ${formatCurrency(stats.sales.today)}`}
                        icon={ShoppingCart}
                        trend={stats.sales.growth >= 0 ? 'up' : 'down'}
                        trendValue={stats.sales.growth}
                    />
                    <StatCard
                        title="Pembelian Bulan Ini"
                        value={formatCurrency(stats.purchases.month)}
                        description={`Hari ini: ${formatCurrency(stats.purchases.today)}`}
                        icon={Package}
                        trend={stats.purchases.growth >= 0 ? 'up' : 'down'}
                        trendValue={stats.purchases.growth}
                    />
                    <StatCard
                        title="Profit Bulan Ini"
                        value={formatCurrency(stats.profit.month)}
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
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Piutang</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.payments.receivables)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Rata: {stats.payments.avgDaysToPay} hari
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Hutang</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.payments.payables)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Belum dibayar</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cash Flow Hari Ini</CardTitle>
                            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${(stats.payments.todaySalePayments - stats.payments.todayPurchasePayments) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats.payments.todaySalePayments - stats.payments.todayPurchasePayments)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Masuk: {formatCurrency(stats.payments.todaySalePayments)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Saldo Bank</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.bankBalance)}</div>
                            <p className="text-xs text-muted-foreground mt-1">{banks.length} bank/kas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Alerts & Warnings */}
                {(criticalStockItems.length > 0 || overdueSales.length > 0 || stats.payments.overdueAmount > 0) && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {criticalStockItems.length > 0 && (
                            <Card className="border-red-200 bg-red-50/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        Stok Kritis ({criticalStockItems.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                        {criticalStockItems.slice(0, 3).map((item) => (
                                            <div key={item.id} className="flex items-center justify-between text-sm">
                                                <span className="truncate flex-1">{item.name}</span>
                                                <Badge variant="destructive" className="ml-2 text-xs">
                                                    {item.stock}
                                                </Badge>
                                            </div>
                                        ))}
                                        {criticalStockItems.length > 3 && (
                                            <p className="text-xs text-muted-foreground pt-1">
                                                +{criticalStockItems.length - 3} lainnya
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {overdueSales.length > 0 && (
                            <Card className="border-red-200 bg-red-50/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <XCircle className="h-4 w-4 text-red-500" />
                                        Piutang Terlambat ({overdueSales.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                        {overdueSales.slice(0, 3).map((sale) => (
                                            <div key={sale.id} className="flex items-center justify-between text-sm">
                                                <span className="truncate flex-1">{sale.sale_number}</span>
                                                <div className="flex items-center gap-2 ml-2">
                                                    <Badge variant="destructive" className="text-xs">
                                                        {Math.floor(sale.days_overdue)}h
                                                    </Badge>
                                                    <span className="text-xs font-medium">{formatCurrency(sale.remaining_amount)}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {overdueSales.length > 3 && (
                                            <p className="text-xs text-muted-foreground pt-1">
                                                +{overdueSales.length - 3} lainnya
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {stats.returnRate > 2 && (
                            <Card className={stats.returnRate > 5 ? 'border-red-200 bg-red-50/50' : 'border-orange-200 bg-orange-50/50'}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <RotateCcw className={`h-4 w-4 ${stats.returnRate > 5 ? 'text-red-500' : 'text-orange-500'}`} />
                                        Tingkat Retur
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${stats.returnRate > 5 ? 'text-red-600' : 'text-orange-600'}`}>
                                        {stats.returnRate.toFixed(2)}%
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Retur penjualan bulan ini</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Business Insights - 3 Column Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Top Selling Items */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 className="h-4 w-4 text-blue-500" />
                                Barang Terlaris
                            </CardTitle>
                            <CardDescription className="text-xs">Top 5 bulan ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topSellingItems.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Tidak ada data</p>
                            ) : (
                                <div className="space-y-2">
                                    {topSellingItems.slice(0, 5).map((item, index) => (
                                        <div key={item.id} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}.</span>
                                                <p className="text-sm font-medium truncate">{item.name}</p>
                                            </div>
                                            <div className="text-right ml-2">
                                                <p className="text-xs font-medium">{formatCurrency(item.total_revenue)}</p>
                                                <p className="text-xs text-muted-foreground">Qty: {item.total_quantity.toFixed(0)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Customers */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="h-4 w-4 text-green-500" />
                                Pelanggan Teratas
                            </CardTitle>
                            <CardDescription className="text-xs">Top 5 bulan ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topCustomers.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Tidak ada data</p>
                            ) : (
                                <div className="space-y-2">
                                    {topCustomers.map((customer, index) => (
                                        <div key={customer.customer?.id || index} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}.</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{customer.customer?.name || 'No Customer'}</p>
                                                    <p className="text-xs text-muted-foreground">{customer.transaction_count} transaksi</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold ml-2">{formatCurrency(customer.total_sales)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Suppliers */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Truck className="h-4 w-4 text-blue-500" />
                                Supplier Teratas
                            </CardTitle>
                            <CardDescription className="text-xs">Top 5 bulan ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topSuppliers.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Tidak ada data</p>
                            ) : (
                                <div className="space-y-2">
                                    {topSuppliers.map((supplier, index) => (
                                        <div key={supplier.supplier?.id || index} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}.</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{supplier.supplier?.name || 'No Supplier'}</p>
                                                    <p className="text-xs text-muted-foreground">{supplier.transaction_count} transaksi</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold ml-2">{formatCurrency(supplier.total_purchases)}</p>
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
                    {(lowStockItems.length > 0 || criticalStockItems.length > 0) && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                    Stok Menipis
                                </CardTitle>
                                <CardDescription className="text-xs">Stok ≤ 10</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {lowStockItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Tidak ada</p>
                                ) : (
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                        {lowStockItems.slice(0, 8).map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-1.5 rounded border text-sm">
                                                <span className="truncate flex-1">{item.name}</span>
                                                <Badge variant={item.stock <= 5 ? 'destructive' : 'warning'} className="ml-2 text-xs">
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
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    Stok Tidak Bergerak
                                </CardTitle>
                                <CardDescription className="text-xs">Tidak terjual 90+ hari</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                    {deadStockItems.slice(0, 8).map((item) => (
                                        <div key={item.id} className="p-1.5 rounded border text-sm">
                                            <p className="font-medium truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Stok: {item.stock.toFixed(0)} • {item.days_since_last_sale !== null ? `${item.days_since_last_sale} hari lalu` : 'Belum pernah'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Bank Balances */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Saldo Bank/Kas</CardTitle>
                            <CardDescription className="text-xs">Total: {formatCurrency(stats.bankBalance)}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {banks.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Tidak ada bank/kas</p>
                                ) : (
                                    banks.map((bank) => (
                                        <div key={bank.id} className="flex items-center justify-between p-1.5 rounded border text-sm">
                                            <div>
                                                <p className="font-medium">{bank.name}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{bank.type}</p>
                                            </div>
                                            <p className="font-bold">{formatCurrency(bank.balance)}</p>
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
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    Piutang Terlambat
                                </CardTitle>
                                <CardDescription className="text-xs">Total: {formatCurrency(stats.payments.overdueAmount)}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="h-8 text-xs">No. Penjualan</TableHead>
                                                <TableHead className="h-8 text-xs">Terlambat</TableHead>
                                                <TableHead className="h-8 text-xs text-right">Sisa</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {overdueSales.slice(0, 5).map((sale) => (
                                                <TableRow
                                                    key={sale.id}
                                                    className="cursor-pointer hover:bg-muted h-10"
                                                    onClick={() => router.visit(`/sales/${sale.id}`)}
                                                >
                                                    <TableCell className="font-medium text-xs">{sale.sale_number}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="destructive" className="text-xs">
                                                            {Math.floor(sale.days_overdue)}h
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-xs text-red-600">
                                                        {formatCurrency(sale.remaining_amount)}
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
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                    Jatuh Tempo (30 hari)
                                </CardTitle>
                                <CardDescription className="text-xs">Penjualan</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="h-8 text-xs">No. Penjualan</TableHead>
                                                <TableHead className="h-8 text-xs">Jatuh Tempo</TableHead>
                                                <TableHead className="h-8 text-xs text-right">Sisa</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {salesDueSoon.slice(0, 5).map((sale) => {
                                                const daysUntilDue = Math.ceil(
                                                    (new Date(sale.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                                                );
                                                const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

                                                return (
                                                    <TableRow
                                                        key={sale.id}
                                                        className="cursor-pointer hover:bg-muted h-10"
                                                        onClick={() => router.visit(`/sales/${sale.id}`)}
                                                    >
                                                        <TableCell className="font-medium text-xs">{sale.sale_number}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs">{formatDate(sale.due_date)}</span>
                                                                {isDueSoon && (
                                                                    <Badge variant="warning" className="text-xs">
                                                                        {daysUntilDue}d
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-xs">
                                                            {formatCurrency(sale.remaining_amount)}
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
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                    Jatuh Tempo (30 hari)
                                </CardTitle>
                                <CardDescription className="text-xs">Pembelian</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="h-8 text-xs">No. Pembelian</TableHead>
                                                <TableHead className="h-8 text-xs">Jatuh Tempo</TableHead>
                                                <TableHead className="h-8 text-xs text-right">Sisa</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {purchasesDueSoon.slice(0, 5).map((purchase) => {
                                                const daysUntilDue = Math.ceil(
                                                    (new Date(purchase.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                                                );
                                                const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

                                                return (
                                                    <TableRow
                                                        key={purchase.id}
                                                        className="cursor-pointer hover:bg-muted h-10"
                                                        onClick={() => router.visit(`/purchases/${purchase.id}`)}
                                                    >
                                                        <TableCell className="font-medium text-xs">{purchase.purchase_number}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs">{formatDate(purchase.due_date)}</span>
                                                                {isDueSoon && (
                                                                    <Badge variant="warning" className="text-xs">
                                                                        {daysUntilDue}d
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-xs">
                                                            {formatCurrency(purchase.remaining_amount)}
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
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Activity className="h-4 w-4" />
                                Aktivitas Terbaru
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2 md:grid-cols-2">
                                {recentSales.slice(0, 3).map((sale) => (
                                    <div
                                        key={`sale-${sale.id}`}
                                        className="flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-muted/50"
                                        onClick={() => router.visit(`/sales/${sale.id}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{sale.sale_number}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {sale.customer?.name || 'No Customer'} • {formatDate(sale.sale_date)}
                                            </p>
                                        </div>
                                        <div className="text-right ml-2">
                                            <p className="text-sm font-bold">{formatCurrency(Number(sale.total_amount))}</p>
                                            <Badge variant={sale.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                                                {sale.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {recentPurchases.slice(0, 3).map((purchase) => (
                                    <div
                                        key={`purchase-${purchase.id}`}
                                        className="flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-muted/50"
                                        onClick={() => router.visit(`/purchases/${purchase.id}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{purchase.purchase_number}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {purchase.supplier?.name || 'No Supplier'} • {formatDate(purchase.purchase_date)}
                                            </p>
                                        </div>
                                        <div className="text-right ml-2">
                                            <p className="text-sm font-bold">{formatCurrency(Number(purchase.total_amount))}</p>
                                            <Badge variant={purchase.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
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
