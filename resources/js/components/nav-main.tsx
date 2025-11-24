import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();

    const normalizeHref = (href: NavItem['href']): string => {
        if (typeof href === 'string') return href;
        if (typeof href === 'object' && 'url' in href) return href.url;
        return '';
    };

    const isActiveLink = (href: NavItem['href']) => {
        const url = normalizeHref(href);
        return url !== '' && page.url.startsWith(url);
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const hasChildren =
                        Array.isArray(item.children) &&
                        item.children.length > 0;

                    if (hasChildren) {
                        const isChildActive = item.children!.some((subItem) =>
                            isActiveLink(subItem.href),
                        );
                        const itemHref = normalizeHref(item.href);
                        const hasValidHref = itemHref !== '' && itemHref !== '#';
                        const isActive = hasValidHref ? isActiveLink(item.href) : isChildActive;

                        return (
                            <Collapsible
                                key={item.title}
                                defaultOpen={isChildActive}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    {hasValidHref ? (
                                        <div className="flex items-center w-full group/item">
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                className="flex-1 justify-start"
                                                tooltip={item.title}
                                            >
                                                <Link
                                                    href={itemHref}
                                                    className="flex items-center gap-2 w-full"
                                                >
                                                    {item.icon && <item.icon />}
                                                    <span className="truncate">{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton
                                                    className="w-8 h-8 p-0 justify-center ml-1"
                                                    tooltip="Toggle submenu"
                                                >
                                                    <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </div>
                                    ) : (
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton
                                                isActive={isChildActive}
                                                className="w-full justify-start"
                                                tooltip={item.title}
                                            >
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                    )}

                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.children!.map((subItem) => {
                                                const isActive = isActiveLink(
                                                    subItem.href,
                                                );

                                                return (
                                                    <SidebarMenuSubItem
                                                        key={subItem.title}
                                                    >
                                                        <SidebarMenuSubButton
                                                            onClick={() =>
                                                                router.visit(
                                                                    normalizeHref(
                                                                        subItem.href,
                                                                    ),
                                                                )
                                                            }
                                                            isActive={isActive}
                                                            className="w-full justify-start"
                                                        >
                                                            <span>
                                                                {subItem.title}
                                                            </span>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                );
                                            })}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    }

                    const isActive = isActiveLink(item.href);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className="w-full justify-start"
                                tooltip={item.title}
                            >
                                <Link
                                    href={normalizeHref(item.href)}
                                    className="flex items-center gap-2"
                                >
                                    {item.icon && <item.icon />}
                                    <span className="truncate">
                                        {item.title}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
