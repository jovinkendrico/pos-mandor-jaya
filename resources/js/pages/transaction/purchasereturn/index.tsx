import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import PurchaseReturnTable from '@/components/transaction/purchasereturns/purchasereturn-table';
import AppLayout from '@/layouts/app-layout';
import { index, create } from '@/routes/purchase-returns';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface Supplier {
    id: number;
    name: string;
}

interface Purchase {
    id: number;
    purchase_number: string;
    supplier?: Supplier;
}

interface PurchaseReturn {
    id: number;
    return_number: string;
    purchase: Purchase;
    return_date: string;
    total_amount: string;
    status: 'pending' | 'confirmed';
}

interface PageProps {
    returns: {
        data: PurchaseReturn[];
    };
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
];

export default function PurchaseReturnIndex({ returns }: PageProps) {
    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleView = (returnData: PurchaseReturn) => {
        router.visit(`/purchase-returns/${returnData.id}`);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Retur Beli" />
                <div className="flex justify-between">
                    <PageTitle title="Retur Pembelian" />
                    <Button onClick={handleCreate}>
                        <Plus />
                        Tambah Retur Beli
                    </Button>
                </div>
                <PurchaseReturnTable returns={returns.data} onView={handleView} />
            </AppLayout>
        </>
    );
}

