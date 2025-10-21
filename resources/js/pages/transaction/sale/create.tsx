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

interface PageProps {
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
        title: 'Tambah',
        href: '#',
    },
];

export default function SaleCreate({ customers, items }: PageProps) {
    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Tambah Penjualan" />
                <PageTitle title="Tambah Penjualan" />
                <SaleForm customers={customers} items={items} />
            </AppLayout>
        </>
    );
}

