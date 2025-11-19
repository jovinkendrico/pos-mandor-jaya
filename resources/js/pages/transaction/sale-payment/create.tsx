import PageTitle from '@/components/page-title';
import SalePaymentForm from '@/components/transaction/sale-payments/sale-payment-form';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Bank } from '@/types';
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
        title: 'Tambah',
        href: '#',
    },
];

export default function SalePaymentCreate({ sales, banks }: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Pembayaran Penjualan" />
            <PageTitle title="Tambah Pembayaran Penjualan" />
            <SalePaymentForm sales={sales} banks={banks} />
        </AppLayout>
    );
}

