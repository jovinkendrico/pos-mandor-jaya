import PageTitle from '@/components/page-title';
import SaleForm from '@/components/transaction/sales/sale-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/sales';
import { BreadcrumbItem, ICustomer, IItem, ISale } from '@/types';
import { Head } from '@inertiajs/react';

interface PageProps {
    sale: ISale;
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
        title: 'Edit',
        href: '#',
    },
];

const SaleEdit = (props: PageProps) => {
    const { sale, customers, items } = props;
    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Edit Penjualan ${sale.sale_number}`} />
                <PageTitle title={`Edit Penjualan ${sale.sale_number}`} />
                <SaleForm
                    sale={sale}
                    customerOptions={customers}
                    items={items}
                />
            </AppLayout>
        </>
    );
};
export default SaleEdit;
