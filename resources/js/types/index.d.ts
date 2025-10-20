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

export interface City {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Customer {
    id: number;
    name: string;
    address: string;
    city_id: number;
    city?: City;
    phone_number: string;
    contact: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Supplier {
    id: number;
    name: string;
    address: string;
    city_id: number;
    city?: City;
    phone_number: string;
    contact: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Bank {
    id: number;
    name: string;
    type: 'bank' | 'cash';
    account_number?: string;
    account_name?: string;
    balance: string;
    description?: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface ItemUom {
    id: number;
    item_id: number;
    uom_name: string;
    conversion_value: number;
    price: string;
    is_base: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Item {
    id: number;
    code: string;
    name: string;
    base_uom: string;
    stock: string;
    description?: string;
    uoms?: ItemUom[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface PageProps {
    auth: Auth;
    [key: string]: unknown;
}
