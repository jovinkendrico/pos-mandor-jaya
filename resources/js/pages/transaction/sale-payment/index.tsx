import PageTitle from '@/components/page-title';
import SalePaymentTable from '@/components/transaction/sale-payments/sale-payment-table';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SalePayment, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface PageProps {
    payments: PaginatedData<SalePayment>;
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
];

export default function SalePaymentIndex({ payments }: PageProps) {
    const handleCreate = () => {
        router.visit('/sale-payments/create');
    };

    const handleView = (payment: SalePayment) => {
        router.visit(`/sale-payments/${payment.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pembayaran Penjualan" />
            <div className="flex justify-between">
                <PageTitle title="Pembayaran Penjualan" />
                <Button onClick={handleCreate} className="btn-primary">
                    <Plus />
                    Tambah Pembayaran
                </Button>
            </div>
            <SalePaymentTable payments={payments.data} onView={handleView} />
        </AppLayout>
    );
}

