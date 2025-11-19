import PageTitle from '@/components/page-title';
import PurchasePaymentForm from '@/components/transaction/purchase-payments/purchase-payment-form';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Bank, PurchasePayment } from '@/types';
import { Head } from '@inertiajs/react';

interface Purchase {
    id: number;
    purchase_number: string;
    supplier?: { name: string };
    purchase_date: string;
    total_amount: number;
    total_paid?: number;
    remaining_amount?: number;
}

interface PageProps {
    payment: PurchasePayment;
    purchases: Purchase[];
    banks: Bank[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Pembayaran Pembelian',
        href: '/purchase-payments',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function PurchasePaymentEdit({ payment, purchases, banks }: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Pembayaran ${payment.payment_number}`} />
            <PageTitle title={`Edit Pembayaran ${payment.payment_number}`} />
            <PurchasePaymentForm payment={payment} purchases={purchases} banks={banks} />
        </AppLayout>
    );
}

