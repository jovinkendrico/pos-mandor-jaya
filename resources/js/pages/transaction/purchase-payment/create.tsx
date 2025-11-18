import PageTitle from '@/components/page-title';
import PurchasePaymentForm from '@/components/transaction/purchase-payments/purchase-payment-form';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Bank, IPurchase } from '@/types';
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
        title: 'Tambah',
        href: '#',
    },
];

export default function PurchasePaymentCreate({ purchases, banks }: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Pembayaran Pembelian" />
            <PageTitle title="Tambah Pembayaran Pembelian" />
            <PurchasePaymentForm purchases={purchases} banks={banks} />
        </AppLayout>
    );
}

