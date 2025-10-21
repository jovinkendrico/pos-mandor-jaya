import PageTitle from '@/components/page-title';
import PurchaseForm from '@/components/transaction/purchases/purchase-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/purchases';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface Supplier {
    id: number;
    name: string;
}

interface ItemUom {
    id: number;
    uom_name: string;
    price: string;
    conversion_value: number;
}

interface Item {
    id: number;
    code: string;
    name: string;
    stock: string;
    uoms: ItemUom[];
}

interface PageProps {
    suppliers: Supplier[];
    items: Item[];
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

export default function PurchaseCreate({ suppliers, items }: PageProps) {
    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Tambah Pembelian" />
                <PageTitle title="Tambah Pembelian" />
                <PurchaseForm suppliers={suppliers} items={items} />
            </AppLayout>
        </>
    );
}

