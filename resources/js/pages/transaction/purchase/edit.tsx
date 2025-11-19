import PageTitle from '@/components/page-title';
import PurchaseForm from '@/components/transaction/purchases/purchase-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/purchases';
import { BreadcrumbItem, IItem, IPurchase, ISupplier } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    purchase: IPurchase;
    suppliers: ISupplier[];
    items: IItem[];
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
        title: 'Edit',
        href: '#',
    },
];

const PurchaseEdit = ({ purchase, suppliers, items }: PageProps) => {
    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Edit Pembelian ${purchase.purchase_number}`} />
                <div className="flex flex-row items-center gap-2">
                    <Link href={index().url}>
                        <ArrowLeft className="h-8 w-8" />
                    </Link>
                    <PageTitle
                        title={`Edit Pembelian ${purchase.purchase_number}`}
                    />
                </div>
                <PurchaseForm
                    purchase={purchase}
                    supplierOptions={suppliers}
                    items={items}
                />
            </AppLayout>
        </>
    );
};

export default PurchaseEdit;
