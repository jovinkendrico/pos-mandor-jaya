import PageTitle from '@/components/page-title';
import PurchaseReturnForm from '@/components/transaction/purchasereturns/purchasereturn-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/purchase-returns';
import { BreadcrumbItem, IBank, IPurchase } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

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
                <div className="flex flex-row items-center gap-2">
                    <Link href={index().url}>
                        <ArrowLeft className="h-8 w-8" />
                    </Link>
                    <PageTitle title="Tambah Retur Pembelian" />
                </div>
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
