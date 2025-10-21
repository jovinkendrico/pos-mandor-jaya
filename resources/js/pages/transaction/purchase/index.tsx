import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import PurchaseTable from '@/components/transaction/purchases/purchase-table';
import AppLayout from '@/layouts/app-layout';
import { index, create } from '@/routes/purchases';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface Supplier {
    id: number;
    name: string;
}

interface Item {
    id: number;
    name: string;
}

interface ItemUom {
    id: number;
    uom_name: string;
}

interface PurchaseDetail {
    id: number;
    item: Item;
    item_uom: ItemUom;
    quantity: string;
    price: string;
    discount1_percent: string;
    discount2_percent: string;
    subtotal: string;
}

interface Purchase {
    id: number;
    purchase_number: string;
    supplier?: Supplier;
    purchase_date: string;
    due_date?: string;
    subtotal: string;
    total_amount: string;
    status: 'pending' | 'confirmed';
    details: PurchaseDetail[];
}

interface PageProps {
    purchases: {
        data: Purchase[];
    };
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

export default function PurchaseIndex({ purchases }: PageProps) {
    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleView = (purchase: Purchase) => {
        router.visit(`/purchases/${purchase.id}`);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Pembelian" />
                <div className="flex justify-between">
                    <PageTitle title="Pembelian" />
                    <Button onClick={handleCreate}>
                        <Plus />
                        Tambah Pembelian
                    </Button>
                </div>
                <PurchaseTable purchases={purchases.data} onView={handleView} />
            </AppLayout>
        </>
    );
}

