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
    flash: {
        success?: string;
        error?: string;
    };
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
export enum SaleStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
}

export enum ReturnType {
    STOCK_ONLY = 'stock_only',
    STOCK_AND_REFUND = 'stock_and_refund',
}

export interface Purchase {
    id: number;
    supplier_id: number;
    purchase_number: string;
    supplier: Supplier;
    purchase_date: Date;
    due_date?: Date;
    subtotal?: number;
    discount1_percent?: number;
    discount1_amount?: number;
    discount2_percent?: number;
    discount2_amount?: number;
    total_after_discount: number;
    ppn_percent?: number;
    ppn_amount?: number;
    total_amount: number;
    status?: PurchaseStatus;
    notes: string;
    details: PurchaseDetail[];
}

export type IPurchase = Pick<
    Purchase,
    | 'id'
    | 'supplier_id'
    | 'purchase_number'
    | 'purchase_date'
    | 'due_date'
    | 'subtotal'
    | 'discount1_percent'
    | 'discount2_percent'
    | 'discount1_amount'
    | 'discount2_amount'
    | 'ppn_percent'
    | 'ppn_amount'
    | 'total_amount'
    | 'status'
    | 'notes'
> & {
    supplier: ISupplier;
    details: IPurchaseDetail[];
    total_paid?: number;
    remaining_amount?: number;
};

export interface PurchaseDetail {
    id?: number;
    purchase_id: number;
    item_id: number;
    item?: IItem;
    item_uom_id: number;
    item_uom?: IItemUOM;
    quantity: number;
    price: number;
    discount1_percent?: number;
    discount1_amount?: number;
    discount2_percent?: number;
    discount2_amount?: number;
    subtotal?: number;
}

export type IPurchaseDetail = Pick<
    PurchaseDetail,
    | 'id'
    | 'item_id'
    | 'item_uom_id'
    | 'item_uom'
    | 'item'
    | 'quantity'
    | 'price'
    | 'discount1_percent'
    | 'discount2_percent'
    | 'subtotal'
>;

export interface Sale {
    id: number;
    customer_id: number;
    sale_number: string;
    customer: Customer;
    sale_date: Date;
    due_date?: Date;
    subtotal?: number;
    discount1_percent?: number;
    discount1_amount?: number;
    discount2_percent?: number;
    discount2_amount?: number;
    total_after_discount: number;
    ppn_percent?: number;
    ppn_amount?: number;
    total_amount: number;
    total_paid?: number;
    remaining_amount?: number;
    total_cost: number;
    total_profit: number;
    status?: SaleStatus;
    notes: string;
    details: PurchaseDetail[];
}

export type ISale = Pick<
    Sale,
    | 'id'
    | 'customer_id'
    | 'sale_number'
    | 'sale_date'
    | 'due_date'
    | 'subtotal'
    | 'discount1_percent'
    | 'discount2_percent'
    | 'discount1_amount'
    | 'discount2_amount'
    | 'ppn_percent'
    | 'ppn_amount'
    | 'total_amount'
    | 'total_paid'
    | 'remaining_amount'
    | 'total_cost'
    | 'total_profit'
    | 'status'
    | 'notes'
> & {
    customer: ICustomer;
    details: ISaleDetail[];
};

export interface SaleDetail {
    id?: number;
    sale_id: number;
    item_id: number;
    item?: IItem;
    item_uom_id: number;
    item_uom?: IItemUOM;
    quantity: number;
    price: number;
    discount1_percent?: number;
    discount1_amount?: number;
    discount2_percent?: number;
    discount2_amount?: number;
    subtotal?: number;
    cost?: number;
    profit?: number;
}

export type ISaleDetail = Pick<
    SaleDetail,
    | 'id'
    | 'item_id'
    | 'item_uom_id'
    | 'item_uom'
    | 'item'
    | 'quantity'
    | 'price'
    | 'discount1_percent'
    | 'discount2_percent'
    | 'subtotal'
    | 'cost'
    | 'profit'
>;

export interface PurchaseReturn {
    id: number;
    purchase_id: number;
    purchase: Purchase;
    return_number: string;
    return_date: Date;
    return_type: ReturnType;
    refund_bank_id?: number;
    refund_method?: number;
    total_amount: number;
    status: PurchaseStatus;
    ppn_percent?: number;
    ppn_amount?: number;
    subtotal: number;
    discount1_percent?: number;
    discount2_percent?: number;
    discount1_amount?: number;
    discount2_amount?: number;
    reason?: string;
    details: PurchaseReturnDetail[];
}

export type IPurchaseReturn = Pick<
    PurchaseReturn,
    | 'id'
    | 'purchase_id'
    | 'return_number'
    | 'return_date'
    | 'return_type'
    | 'refund_bank_id'
    | 'refund_method'
    | 'total_amount'
    | 'status'
    | 'ppn_percent'
    | 'ppn_amount'
    | 'subtotal'
    | 'discount1_percent'
    | 'discount2_percent'
    | 'discount1_amount'
    | 'discount2_amount'
    | 'reason'
> & {
    purchase: IPurchase;
    details: IPurchaseDetail[];
};

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
    | 'id'
    | 'code'
    | 'name'
    | 'type'
    | 'parent_id'
    | 'description'
    | 'is_active'
    | 'subtotal'
>;

export interface PurchasePayment {
    id: number;
    payment_number: string;
    payment_date: string;
    total_amount: number;
    bank_id?: number;
    bank?: Bank;
    payment_method: 'cash' | 'transfer' | 'giro' | 'cek' | 'other';
    reference_number?: string;
    notes?: string;
    status: 'pending' | 'confirmed';
    purchases?: IPurchase[];
    items?: PurchasePaymentItem[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface PurchasePaymentItem {
    id: number;
    purchase_payment_id: number;
    purchase_id: number;
    purchase?: IPurchase;
    amount: number;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type IPurchasePayment = Pick<
    PurchasePayment,
    | 'id'
    | 'payment_number'
    | 'payment_date'
    | 'total_amount'
    | 'bank_id'
    | 'payment_method'
    | 'reference_number'
    | 'notes'
    | 'status'
> & {
    items?: Array<Pick<PurchasePaymentItem, 'purchase_id' | 'amount'>>;
};

export interface SalePayment {
    id: number;
    payment_number: string;
    payment_date: string;
    total_amount: number;
    bank_id?: number;
    bank?: Bank;
    payment_method: 'cash' | 'transfer' | 'giro' | 'cek' | 'other';
    reference_number?: string;
    notes?: string;
    status: 'pending' | 'confirmed';
    sales?: any[]; // Sale interface array
    items?: SalePaymentItem[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface SalePaymentItem {
    id: number;
    sale_payment_id: number;
    sale_id: number;
    sale?: any; // Sale interface
    amount: number;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type ISalePayment = Pick<
    SalePayment,
    | 'id'
    | 'payment_number'
    | 'payment_date'
    | 'total_amount'
    | 'bank_id'
    | 'payment_method'
    | 'reference_number'
    | 'notes'
    | 'status'
> & {
    items?: Array<Pick<SalePaymentItem, 'sale_id' | 'amount'>>;
};

export interface CashIn {
    id: number;
    cash_in_number: string;
    cash_in_date: string;
    bank_id: number;
    bank?: Bank;
    chart_of_account_id: number;
    chart_of_account?: ChartOfAccount;
    amount: number;
    description?: string;
    status: 'draft' | 'posted';
    reference_type?: string;
    reference_id?: number;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface CashOut {
    id: number;
    cash_out_number: string;
    cash_out_date: string;
    bank_id: number;
    bank?: Bank;
    chart_of_account_id: number;
    chart_of_account?: ChartOfAccount;
    amount: number;
    description?: string;
    status: 'draft' | 'posted';
    reference_type?: string;
    reference_id?: number;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface JournalEntryDetail {
    id: number;
    journal_entry_id: number;
    chart_of_account_id: number;
    chart_of_account?: ChartOfAccount;
    debit: number;
    credit: number;
    description?: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface JournalEntry {
    id: number;
    journal_number: string;
    journal_date: string;
    reference_type?: string;
    reference_id?: number;
    description?: string;
    status: 'draft' | 'posted' | 'reversed';
    reversed_by?: number;
    reversedBy?: JournalEntry;
    details?: JournalEntryDetail[];
    total_debit?: number;
    total_credit?: number;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}
