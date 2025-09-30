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
import { index as permissionIndex } from '@/routes/permissions';
import { index as roleIndex } from '@/routes/roles';
import { index as userIndex } from '@/routes/users';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { LayoutGrid, User2 } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
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
