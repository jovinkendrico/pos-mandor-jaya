import PageTitle from '@/components/page-title';
import SaleForm from '@/components/transaction/sales/sale-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/sales';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface Customer {
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

interface SaleDetail {
    item_id: string;
    item_uom_id: string;
    quantity: string;
    price: string;
    discount1_percent: string;
    discount2_percent: string;
}

interface Sale {
    id: number;
    sale_number: string;
    customer_id?: number;
    sale_date: string;
    due_date?: string;
    discount1_percent: string;
    discount2_percent: string;
    ppn_percent: string;
    notes?: string;
    details: SaleDetail[];
}

interface PageProps {
    sale: Sale;
    customers: Customer[];
    items: Item[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Penjualan',
        href: index().url,
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function SaleEdit({ sale, customers, items }: PageProps) {
    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Edit Penjualan ${sale.sale_number}`} />
                <PageTitle title={`Edit Penjualan ${sale.sale_number}`} />
                <SaleForm sale={sale} customers={customers} items={items} />
            </AppLayout>
        </>
    );
}

