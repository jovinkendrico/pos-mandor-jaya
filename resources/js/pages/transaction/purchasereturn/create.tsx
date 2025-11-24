import PageTitle from '@/components/page-title';
import PurchaseReturnForm from '@/components/transaction/purchasereturns/purchasereturn-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/purchase-returns';
import { BreadcrumbItem, IBank, IPurchase } from '@/types';
import { Head } from '@inertiajs/react';

interface PageProps {
    purchases: IPurchase[];
    returnedQuantities?: Record<number, number>;
    banks?: IBank[];
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

const PurchaseReturnCreate = (props: PageProps) => {
    const { purchases, returnedQuantities = {}, banks = [] } = props;

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
};

export default PurchaseReturnCreate;
