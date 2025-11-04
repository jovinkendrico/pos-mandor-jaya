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

export type ICity = Pick<City, 'id' | 'name'>;

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

export type ICustomer = Pick<
    Customer,
    'id' | 'name' | 'address' | 'city_id' | 'city' | 'phone_number' | 'contact'
>;

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

export type ISupplier = Pick<
    Supplier,
    'id' | 'name' | 'address' | 'city_id' | 'city' | 'phone_number' | 'contact'
>;

export interface Bank {
    id: number;
    name: string;
    type: 'bank' | 'cash';
    account_number?: string;
    account_name?: string;
    balance: number;
    description?: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type IBank = Pick<
    Bank,
    | 'id'
    | 'name'
    | 'type'
    | 'account_number'
    | 'account_name'
    | 'balance'
    | 'description'
>;

export interface ItemUom {
    id: number;
    item_id: number;
    uom: IUOM;
    uom_id: number;
    conversion_value: number;
    price: number;
    is_base: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type IItemUOM = Pick<
    ItemUom,
    'uom_id' | 'uom' | 'conversion_value' | 'price' | 'is_base'
>;

export interface Item {
    id: number;
    code: string;
    name: string;
    stock: number;
    description?: string;
    item_uoms: ItemUom[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type IItem = Pick<
    Item,
    'id' | 'name' | 'stock' | 'description' | 'code'
> & {
    item_uoms: IItemUOM[];
};

export interface PageProps {
    auth: Auth;
    [key: string]: unknown;
}

export interface IUOM {
    id: number;
    name: string;
}
