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

interface PurchaseDetail {
    item_id: string;
    item_uom_id: string;
    quantity: string;
    price: string;
    discount1_percent: string;
    discount2_percent: string;
}

interface Purchase {
    id: number;
    purchase_number: string;
    supplier_id?: number;
    purchase_date: string;
    due_date?: string;
    discount1_percent: string;
    discount2_percent: string;
    ppn_percent: string;
    notes?: string;
    details: PurchaseDetail[];
}

interface PageProps {
    purchase: Purchase;
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
        title: 'Edit',
        href: '#',
    },
];

export default function PurchaseEdit({ purchase, suppliers, items }: PageProps) {
    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Edit Pembelian ${purchase.purchase_number}`} />
                <PageTitle title={`Edit Pembelian ${purchase.purchase_number}`} />
                <PurchaseForm purchase={purchase} suppliers={suppliers} items={items} />
            </AppLayout>
        </>
    );
}

