import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePermission } from '@/hooks/use-permission';
import { dashboard } from '@/routes';
import { index as bankIndex } from '@/routes/banks';
import { index as cashInIndex } from '@/routes/cash-ins';
import { index as cashOutIndex } from '@/routes/cash-outs';
import { index as chartOfAccountIndex } from '@/routes/chart-of-accounts';
import { index as cityIndex } from '@/routes/cities';
import { index as customerIndex } from '@/routes/customers';
import { index as itemIndex } from '@/routes/items';
import { index as journalEntryIndex } from '@/routes/journal-entries';
import { index as paymentReceiptIndex } from '@/routes/payment-receipt';
import { index as permissionIndex } from '@/routes/permissions';
import { index as purchasePaymentIndex } from '@/routes/purchase-payments';
import { index as purchaseReturnIndex } from '@/routes/purchase-returns';
import { index as purchaseIndex } from '@/routes/purchases';
import { index as roleIndex } from '@/routes/roles';
import { index as salePaymentIndex } from '@/routes/sale-payments';
import { index as saleReturnIndex } from '@/routes/sale-returns';
import { index as saleIndex } from '@/routes/sales';
import { index as stockAdjustmentIndex } from '@/routes/stock-adjustments';
import { index as supplierIndex } from '@/routes/suppliers';
import { index as uomIndex } from '@/routes/uoms';
import { index as userIndex } from '@/routes/users';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BookOpen,
    CreditCard,
    Database,
    FileText,
    LayoutGrid,
    ShoppingCart,
    User2,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Master',
        href: '#',
        icon: Database,
        children: [
            {
                title: 'Customer',
                href: customerIndex(),
                permissions: ['customers.index'],
            },
            {
                title: 'Supplier',
                href: supplierIndex(),
                permissions: ['suppliers.index'],
            },
            {
                title: 'Bank/Cash',
                href: bankIndex(),
                permissions: ['banks.index'],
            },
            {
                title: 'Kode Perkiraan',
                href: chartOfAccountIndex(),
                permissions: ['chart-of-accounts.index'],
            },
            {
                title: 'Barang',
                href: itemIndex(),
                permissions: ['items.index'],
            },
            {
                title: 'Kota',
                href: cityIndex(),
                permissions: ['cities.index'],
            },
            {
                title: 'UOM',
                href: uomIndex(),
                permissions: ['uoms.index'],
            },
            {
                title: 'Penyesuaian Stok',
                href: stockAdjustmentIndex(),
                permissions: ['stock-adjustments.index'],
            },
        ],
    },
    {
        title: 'Transaksi',
        href: '#',
        icon: ShoppingCart,
        children: [
            {
                title: 'Pembelian',
                href: purchaseIndex(),
                permissions: ['purchases.index'],
            },
            {
                title: 'Penjualan',
                href: saleIndex(),
                permissions: ['sales.index'],
            },
            {
                title: 'Retur Beli',
                href: purchaseReturnIndex(),
                permissions: ['purchase-returns.index'],
            },
            {
                title: 'Retur Jual',
                href: saleReturnIndex(),
                permissions: ['sale-returns.index'],
            },
        ],
    },
    {
        title: 'Pembayaran',
        href: '#',
        icon: CreditCard,
        children: [
            {
                title: 'Pembayaran Pembelian',
                href: purchasePaymentIndex(),
                permissions: ['purchase-payments.index'],
            },
            {
                title: 'Pembayaran Penjualan',
                href: salePaymentIndex(),
                permissions: ['sale-payments.index'],
            },
            {
                title: 'Tanda Terima Faktur',
                href: paymentReceiptIndex(),
                permissions: ['payment-receipt.index'],
            },
            {
                title: 'Kas Masuk',
                href: cashInIndex(),
                permissions: ['cash-ins.index'],
            },
            {
                title: 'Kas Keluar',
                href: cashOutIndex(),
                permissions: ['cash-outs.index'],
            },
        ],
    },
    {
        title: 'Akuntansi',
        href: '#',
        icon: BookOpen,
        permissions: ['finance.view'],
        children: [
            {
                title: 'Jurnal',
                href: journalEntryIndex(),
                permissions: ['journal-entries.index'],
            },
            {
                title: 'Laporan Laba Rugi',
                href: '/profit-loss',
                permissions: ['finance.view'],
            },
            {
                title: 'Buku Besar',
                href: '/general-ledger',
                permissions: ['finance.view'],
            },
        ],
    },
    {
        title: 'Laporan',
        href: '/reports',
        icon: FileText,
        permissions: ['reports.view'],
        children: [
            {
                title: 'Laporan Penjualan',
                href: '/reports/sale-report',
            },
            {
                title: 'Laporan Pembelian',
                href: '/reports/purchase-report',
            },
            {
                title: 'Laporan Piutang Usaha',
                href: '/reports/receivable-aging',
            },
            {
                title: 'Laporan Hutang Usaha',
                href: '/reports/payable-aging',
            },
            {
                title: 'Laporan Nilai Persediaan',
                href: '/reports/inventory-valuation',
            },
            {
                title: 'Laporan Arus Kas',
                href: '/reports/cash-flow',
            },
            {
                title: 'Laporan Penjualan per Customer',
                href: '/reports/sale-by-customer',
            },
            {
                title: 'Laporan Penjualan per Item',
                href: '/reports/sale-by-item',
            },
            {
                title: 'Laporan Pembelian per Supplier',
                href: '/reports/purchase-by-supplier',
            },
            {
                title: 'Laporan Stok Minimum/Maksimum',
                href: '/reports/stock-min-max',
            },
            {
                title: 'Laporan Neraca',
                href: '/reports/balance-sheet',
            },
            {
                title: 'Laporan Retur Penjualan',
                href: '/reports/sale-return',
            },
            {
                title: 'Laporan Retur Pembelian',
                href: '/reports/purchase-return',
            },
            {
                title: 'Laporan Pembayaran Penjualan',
                href: '/reports/sale-payment',
            },
            {
                title: 'Laporan Pembayaran Pembelian',
                href: '/reports/purchase-payment',
            },
            {
                title: 'Laporan Kas Masuk/Keluar',
                href: '/reports/cash-in-out',
            },
            {
                title: 'Laporan Barang Paling Laku',
                href: '/reports/best-seller',
            },
            {
                title: 'Laporan Barang Paling Tidak Laku',
                href: '/reports/dead-stock',
            },
            {
                title: 'Laporan Perputaran Stok',
                href: '/reports/stock-turnover',
            },
            {
                title: 'Laporan Analisis Margin per Item',
                href: '/reports/margin-by-item',
            },
            {
                title: 'Laporan Analisis Margin per Customer',
                href: '/reports/margin-by-customer',
            },
            {
                title: 'Laporan Binder',
                href: '/reports/binder',
            },
        ],
    },
    {
        title: 'User Settings',
        href: '#',
        icon: User2,
        roles: ['Super Admin'],
        children: [
            {
                title: 'Users',
                href: userIndex(),
                permissions: ['users.index'],
            },
            {
                title: 'Roles',
                href: roleIndex(),
                permissions: ['roles.index'],
            },
            {
                title: 'Permissions',
                href: permissionIndex(),
                permissions: ['permissions.index'],
            },
        ],
    },
];

export function AppSidebar() {
    const { hasRole, hasPermission } = usePermission();

    const filterNavItems = (items: NavItem[]): NavItem[] => {
        return items
            .filter((item) => {
                const allowedByRole =
                    !item.roles || item.roles.some((role) => hasRole(role));
                const allowedByPermission =
                    !item.permissions ||
                    item.permissions.some((perm) => hasPermission(perm));
                return allowedByRole && allowedByPermission;
            })
            .map((item) => ({
                ...item,
                children: item.children
                    ? filterNavItems(item.children)
                    : undefined,
            }));
    };

    const filteredNavItems = filterNavItems(mainNavItems);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
