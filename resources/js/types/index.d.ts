import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    children?: NavItem[];
    roles?: string[];
    permissions?: string[];
}

export interface FlashMessages {
    success?: string;
    error?: string;
}

export interface SharedData {
    name: string;
    errors: Record<string, string>;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    flash: FlashMessages;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles?: Role[]; // Add roles property
    [key: string]: unknown;
}

export interface Permission {
    id: number;
    name: string;
    group: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface PermissionGroup {
    [key: string]: Permission[];
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions: Permission[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface RoleFormData {
    name: string;
    guard_name: string;
    permissions_ids: number[];
}
