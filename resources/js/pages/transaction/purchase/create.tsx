import PageTitle from '@/components/page-title';
import PurchaseForm from '@/components/transaction/purchases/purchase-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/purchases';
import { BreadcrumbItem, ICity, IItem, IPurchase, ISupplier } from '@/types';
import { Head } from '@inertiajs/react';

interface PageProps {
    suppliers: ISupplier[];
    items: IItem[];
    cities: ICity[];
    purchase?: IPurchase;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Pembelian',
        href: index().url,
    },
    {
        title: 'Tambah',
        href: '#',
    },
];

const PurchaseCreate = (props: PageProps) => {
    const { suppliers, items, purchase } = props;

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Tambah Pembelian" />
                <PageTitle title="Tambah Pembelian" />
                <PurchaseForm
                    purchase={purchase}
                    supplierOptions={suppliers}
                    items={items}
                />
            </AppLayout>
        </>
    );
};

export default PurchaseCreate;
