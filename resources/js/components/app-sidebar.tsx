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
import { index as chartOfAccountIndex } from '@/routes/chart-of-accounts';
import { index as cityIndex } from '@/routes/cities';
import { index as customerIndex } from '@/routes/customers';
import { index as itemIndex } from '@/routes/items';
import { index as permissionIndex } from '@/routes/permissions';
import { index as purchaseReturnIndex } from '@/routes/purchase-returns';
import { index as purchaseIndex } from '@/routes/purchases';
import { index as purchasePaymentIndex } from '@/routes/purchase-payments';
import { index as roleIndex } from '@/routes/roles';
import { index as saleReturnIndex } from '@/routes/sale-returns';
import { index as saleIndex } from '@/routes/sales';
import { index as salePaymentIndex } from '@/routes/sale-payments';
import { index as supplierIndex } from '@/routes/suppliers';
import { index as uomIndex } from '@/routes/uoms';
import { index as stockAdjustmentIndex } from '@/routes/stock-adjustments';
import { index as userIndex } from '@/routes/users';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Database, LayoutGrid, ShoppingCart, User2, CreditCard } from 'lucide-react';
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
            },
            {
                title: 'Supplier',
                href: supplierIndex(),
            },
            {
                title: 'Bank/Cash',
                href: bankIndex(),
            },
            {
                title: 'Kode Perkiraan',
                href: chartOfAccountIndex(),
            },
            {
                title: 'Barang',
                href: itemIndex(),
            },
            {
                title: 'Kota',
                href: cityIndex(),
            },
            {
                title: 'UOM',
                href: uomIndex(),
            },
            {
                title: 'Penyesuaian Stok',
                href: stockAdjustmentIndex(),
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
            },
            {
                title: 'Penjualan',
                href: saleIndex(),
            },
            {
                title: 'Retur Beli',
                href: purchaseReturnIndex(),
            },
            {
                title: 'Retur Jual',
                href: saleReturnIndex(),
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
            },
            {
                title: 'Pembayaran Penjualan',
                href: salePaymentIndex(),
            },
        ],
    },
    {
        title: 'User Settings',
        href: '#',
        icon: User2,
        children: [
            {
                title: 'Users',
                href: userIndex(),
            },
            {
                title: 'Roles',
                href: roleIndex(),
            },
            {
                title: 'Permissions',
                href: permissionIndex(),
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
