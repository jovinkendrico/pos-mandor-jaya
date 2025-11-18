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
    chart_of_account_id?: number;
    chart_of_account?: ChartOfAccount;
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
    | 'chart_of_account_id'
    | 'chart_of_account'
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

export interface ItemStockMovement {
    id: number;
    item_id: number;
    reference_type: string;
    reference_id: number;
    quantity: number;
    unit_cost: number;
    remaining_quantity: number;
    movement_date: Date;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    [key: string]: unknown;
}

export type IItemStockMovement = Pick<
    ItemStockMovement,
    'remaining_quantity' | 'unit_cost' | 'movement_date' | 'notes'
> & { id?: number };

export interface Item {
    id: number;
    code: string;
    name: string;
    stock: number;
    modal_price?: number;
    description?: string;
    modal_price?: number;
    item_uoms: ItemUom[];
    stock_movements: ItemStockMovement[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type IItem = Pick<
    Item,
    | 'id'
    | 'name'
    | 'stock'
    | 'modal_price'
    | 'description'
    | 'code'
    | 'modal_price'
> & {
    item_uoms: IItemUOM[];
    stock_movements: IItemStockMovement[];
};

export interface PageProps {
    auth: Auth;
    [key: string]: unknown;
}

export interface IUOM {
    id: number;
    name: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    from: number;
    to: number;
    total: number;
}

export enum PurchaseStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
}

export interface Purchase {
    id: number;
    purchase_number: string;
    purchase_number: string;
    supplier: Supplier;
    purchase_date: Date;
    due_date?: Date;
    subtotal: number;
    discount1_percent?: number;
    discount1_amount?: number;
    discount2_percent?: number;
    discount2_amount?: number;
    total_after_discount: number;
    ppn_percent?: number;
    total_amount: number;
    status?: PurchaseStatus;
    notes: string;
    details: PurchaseDetail[];
}

export type IPurchase = Pick<
    Purchase,
    | 'id'
    | 'purchase_number'
    | 'purchase_date'
    | 'due_date'
    | 'discount1_percent'
    | 'discount2_percent'
    | 'ppn_percent'
    | 'total_amount'
    | 'status'
    | 'notes'
> & {
    supplier: ISupplier;
    details: IPurchaseDetail[];
};

export interface PurchaseDetail {
    id: number;
    purchase_id: number;
    item_id: number;
    item: IItem;
    item_uom_id: number;
    quantity: number;
    price: number;
    discount1_percent?: number;
    discount1_amount?: number;
    discount2_percent?: number;
    discount2_amount?: number;
    subtotal: number;
}

<<<<<<< HEAD
export type IPurchaseDetail = Pick<
    PurchaseDetail,
    | 'item_id'
    | 'item_uom_id'
    | 'quantity'
    | 'price'
    | 'discount1_percent'
    | 'discount2_percent'
=======
export interface ChartOfAccount {
    id: number;
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
    parent_id?: number;
    parent?: ChartOfAccount;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type IChartOfAccount = Pick<
    ChartOfAccount,
    'id' | 'code' | 'name' | 'type' | 'parent_id' | 'description' | 'is_active'
>>>>>>> 69f169f07bc87cd4fdd9b931803903aca0df8197
>;
