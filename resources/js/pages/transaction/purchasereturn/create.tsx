import PageTitle from '@/components/page-title';
import PurchaseReturnForm from '@/components/transaction/purchasereturns/purchasereturn-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/purchase-returns';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface Supplier {
    id: number;
    name: string;
}

interface Item {
    id: number;
    code: string;
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
}

interface Purchase {
    id: number;
    purchase_number: string;
    supplier?: Supplier;
    purchase_date: string;
    ppn_percent: string;
    details: PurchaseDetail[];
}

interface Bank {
    id: number;
    name: string;
}

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

export default function PurchaseReturnCreate({ purchases, returnedQuantities = {}, banks = [] }: PageProps) {
    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Tambah Retur Beli" />
                <PageTitle title="Tambah Retur Pembelian" />
                <PurchaseReturnForm purchases={purchases} returnedQuantities={returnedQuantities} banks={banks} />
            </AppLayout>
        </>
    );
}

