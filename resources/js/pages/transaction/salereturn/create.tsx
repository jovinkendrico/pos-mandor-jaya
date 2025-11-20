import PageTitle from '@/components/page-title';
import SaleReturnForm from '@/components/transaction/salereturns/salereturn-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/sale-returns';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface Customer {
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

interface SaleDetail {
    id: number;
    item: Item;
    item_uom: ItemUom;
    quantity: string;
    price: string;
    discount1_percent: string;
    discount2_percent: string;
}

interface Sale {
    id: number;
    sale_number: string;
    customer?: Customer;
    sale_date: string;
    ppn_percent: string;
    details: SaleDetail[];
}

interface Bank {
    id: number;
    name: string;
}

interface PageProps {
    sales: Sale[];
    returnedQuantities?: Record<number, number>;
    banks?: Bank[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Retur Jual',
        href: index().url,
    },
    {
        title: 'Tambah',
        href: '#',
    },
];

export default function SaleReturnCreate({ sales, returnedQuantities = {}, banks = [] }: PageProps) {
    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Tambah Retur Jual" />
                <PageTitle title="Tambah Retur Penjualan" />
                <SaleReturnForm sales={sales} returnedQuantities={returnedQuantities} banks={banks} />
            </AppLayout>
        </>
    );
}

