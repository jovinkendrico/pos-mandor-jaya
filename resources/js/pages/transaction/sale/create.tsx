import PageTitle from '@/components/page-title';
import SaleForm from '@/components/transaction/sales/sale-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/sales';
import { BreadcrumbItem, ICustomer, IItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    customers: ICustomer[];
    items: IItem[];
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

const SaleCreate = (props: PageProps) => {
    const { customers, items } = props;

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Tambah Penjualan" />
                <div className="flex flex-row items-center gap-2">
                    <Link href={index().url}>
                        <ArrowLeft className="h-8 w-8" />
                    </Link>
                    <PageTitle title="Tambah Penjualan" />
                </div>
                <SaleForm customerOptions={customers} items={items} />
            </AppLayout>
        </>
    );
};

export default SaleCreate;
