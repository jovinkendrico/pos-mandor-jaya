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

export enum RefundMethod {
    REDUCE_PAYABLE = 'reduce_payable',
    CASH_REFUND = 'cash_refund',
    REDUCE_RECEIVABLE = 'reduce_receivable',
}

export enum PurchasePaymentStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
}

export enum SalePaymentStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
}

export enum PaymentMethod {
    CASH = 'cash',
    TRANSFER = 'transfer',
    GIRO = 'giro',
    CEK = 'cek',
    OTHER = 'other',
    REFUND = 'refund',
}
