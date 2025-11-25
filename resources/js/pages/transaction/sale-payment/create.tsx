import PageTitle from '@/components/page-title';
import SalePaymentForm from '@/components/transaction/sale-payments/sale-payment-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/sale-payments';
import { BreadcrumbItem, IBank, ISale } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    sales: ISale[];
    banks: IBank[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Pembayaran Penjualan',
        href: '/sale-payments',
    },
    {
        title: 'Tambah',
        href: '#',
    },
];

const SalePaymentCreate = (props: PageProps) => {
    const { sales, banks } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Pembayaran Penjualan" />
            <div className="flex flex-row items-center gap-2">
                <Link href={index().url}>
                    <ArrowLeft className="h-8 w-8" />
                </Link>
                <PageTitle title="Tambah Pembayaran Penjualan" />
            </div>
            <SalePaymentForm sales={sales} banks={banks} />
        </AppLayout>
    );
};

export default SalePaymentCreate;
