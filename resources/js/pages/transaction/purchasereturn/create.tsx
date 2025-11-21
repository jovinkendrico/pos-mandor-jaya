import PageTitle from '@/components/page-title';
import PurchaseReturnForm from '@/components/transaction/purchasereturns/purchasereturn-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/purchase-returns';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface PageProps {
    purchases: Purchase[];
    returnedQuantities?: Record<number, number>;
    banks?: Bank[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Retur Beli',
        href: index().url,
    },
    {
        title: 'Tambah',
        href: '#',
    },
];

export default function PurchaseReturnCreate({
    purchases,
    returnedQuantities = {},
    banks = [],
}: PageProps) {
    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Tambah Retur Beli" />
                <PageTitle title="Tambah Retur Pembelian" />
                <PurchaseReturnForm
                    purchases={purchases}
                    returnedQuantities={returnedQuantities}
                    banks={banks}
                />
            </AppLayout>
        </>
    );
}
