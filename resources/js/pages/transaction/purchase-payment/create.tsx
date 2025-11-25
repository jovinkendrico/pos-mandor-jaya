import PageTitle from '@/components/page-title';
import PurchasePaymentForm from '@/components/transaction/purchase-payments/purchase-payment-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/purchase-payments';
import { BreadcrumbItem, IBank, IPurchase } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    purchases: IPurchase[];
    banks: IBank[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Pembayaran Pembelian',
        href: '/purchase-payments',
    },
    {
        title: 'Tambah',
        href: '#',
    },
];

const PurchasePaymentCreate = ({ purchases, banks }: PageProps) => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Pembayaran Pembelian" />
            <div className="flex flex-row items-center gap-2">
                <Link href={index().url}>
                    <ArrowLeft className="h-8 w-8" />
                </Link>
                <PageTitle title="Tambah Pembayaran Pembelian" />
            </div>
            <PurchasePaymentForm purchases={purchases} banks={banks} />
        </AppLayout>
    );
};

export default PurchasePaymentCreate;
