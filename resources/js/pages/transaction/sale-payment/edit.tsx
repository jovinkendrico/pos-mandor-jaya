import PageTitle from '@/components/page-title';
import SalePaymentForm from '@/components/transaction/sale-payments/sale-payment-form';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Bank, SalePayment } from '@/types';
import { Head } from '@inertiajs/react';

interface Sale {
    id: number;
    sale_number: string;
    customer?: { name: string };
    sale_date: string;
    total_amount: number;
    total_paid?: number;
    remaining_amount?: number;
}

interface PageProps {
    payment: SalePayment;
    sales: Sale[];
    banks: Bank[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Pembayaran Penjualan',
        href: '/sale-payments',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function SalePaymentEdit({ payment, sales, banks }: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Pembayaran ${payment.payment_number}`} />
            <PageTitle title={`Edit Pembayaran ${payment.payment_number}`} />
            <SalePaymentForm payment={payment} sales={sales} banks={banks} />
        </AppLayout>
    );
}

