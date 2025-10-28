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

export interface UOM {
    id: number;
    name: string;
}

export interface Category {
    id: number;
    name: string;
    type: 'income' | 'expense';
    parent_id?: number;
    parent?: Category;
    children?: Category[];
    is_active: boolean;
    description?: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type ICategory = Pick<
    Category,
    'id' | 'name' | 'type' | 'parent_id' | 'parent' | 'is_active' | 'description'
>;

export interface CashFlow {
    id: number;
    type: 'in' | 'out';
    category_id: number;
    category?: Category;
    amount: number;
    description: string;
    reference_type?: 'Purchase' | 'Sale' | 'Manual' | 'Expense';
    reference_id?: number;
    bank_id: number;
    bank?: Bank;
    transaction_date: string;
    created_by: number;
    createdBy?: User;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type ICashFlow = Pick<
    CashFlow,
    | 'id'
    | 'type'
    | 'category_id'
    | 'category'
    | 'amount'
    | 'description'
    | 'reference_type'
    | 'reference_id'
    | 'bank_id'
    | 'bank'
    | 'transaction_date'
    | 'created_by'
    | 'createdBy'
>;

export interface Payment {
    id: number;
    payment_number: string;
    reference_type: 'Purchase' | 'Sale';
    reference_id: number;
    reference?: Purchase | Sale;
    payment_date: string;
    amount_paid: number;
    payment_method: 'cash' | 'bank_transfer' | 'check' | 'other';
    bank_id?: number;
    bank?: Bank;
    notes?: string;
    created_by: number;
    createdBy?: User;
    details?: PaymentDetail[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type IPayment = Pick<
    Payment,
    | 'id'
    | 'payment_number'
    | 'reference_type'
    | 'reference_id'
    | 'reference'
    | 'payment_date'
    | 'amount_paid'
    | 'payment_method'
    | 'bank_id'
    | 'bank'
    | 'notes'
    | 'created_by'
    | 'createdBy'
    | 'details'
>;

export interface PaymentDetail {
    id: number;
    payment_id: number;
    amount: number;
    payment_date: string;
    payment_method: 'cash' | 'bank_transfer' | 'check' | 'other';
    bank_id?: number;
    bank?: Bank;
    notes?: string;
    created_by: number;
    createdBy?: User;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Purchase {
    id: number;
    purchase_number: string;
    supplier_id?: number;
    supplier?: Supplier;
    purchase_date: string;
    due_date?: string;
    subtotal: number;
    discount1_percent: number;
    discount1_amount: number;
    discount2_percent: number;
    discount2_amount: number;
    total_after_discount: number;
    ppn_percent: number;
    ppn_amount: number;
    total_amount: number;
    status: 'pending' | 'confirmed';
    notes?: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Sale {
    id: number;
    sale_number: string;
    customer_id?: number;
    customer?: Customer;
    sale_date: string;
    due_date?: string;
    subtotal: number;
    discount1_percent: number;
    discount1_amount: number;
    discount2_percent: number;
    discount2_amount: number;
    total_after_discount: number;
    ppn_percent: number;
    ppn_amount: number;
    total_amount: number;
    total_cost: number;
    total_profit: number;
    status: 'pending' | 'confirmed';
    notes?: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}
