import PageTitle from '@/components/page-title';
import PurchaseTable from '@/components/transaction/purchases/purchase-table';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { create, index } from '@/routes/purchases';
import { BreadcrumbItem, IPurchase, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    purchases: PaginatedData<IPurchase>;
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
];

const PurchaseIndex = (props: PageProps) => {
    const { purchases } = props;

    const [selectedPurchase, setSelectedPurchase] = useState<
        IPurchase | undefined
    >(undefined);

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleView = (purchase: IPurchase) => {
        router.visit(`/purchases/${purchase.id}`);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Pembelian" />
                <div className="flex justify-between">
                    <PageTitle title="Pembelian" />
                    <Button onClick={handleCreate} className="btn-primary">
                        <Plus />
                        Tambah Pembelian
                    </Button>
                </div>
                <PurchaseTable purchases={purchases.data} />
            </AppLayout>
        </>
    );
};

export default PurchaseIndex;
