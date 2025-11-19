import PageTitle from '@/components/page-title';
import PurchasePaymentTable from '@/components/transaction/purchase-payments/purchase-payment-table';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PurchasePayment, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface PageProps {
    payments: PaginatedData<PurchasePayment>;
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
];

export default function PurchasePaymentIndex({ payments }: PageProps) {
    const handleCreate = () => {
        router.visit('/purchase-payments/create');
    };

    const handleView = (payment: PurchasePayment) => {
        router.visit(`/purchase-payments/${payment.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pembayaran Pembelian" />
            <div className="flex justify-between">
                <PageTitle title="Pembayaran Pembelian" />
                <Button onClick={handleCreate} className="btn-primary">
                    <Plus />
                    Tambah Pembayaran
                </Button>
            </div>
            <PurchasePaymentTable payments={payments.data} onView={handleView} />
        </AppLayout>
    );
}

