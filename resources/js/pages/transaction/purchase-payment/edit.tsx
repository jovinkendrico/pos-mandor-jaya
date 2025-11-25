import PageTitle from '@/components/page-title';
import PurchasePaymentForm from '@/components/transaction/purchase-payments/purchase-payment-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/purchase-payments';
import { BreadcrumbItem, IBank, IPurchase, IPurchasePayment } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    purchase_payment: IPurchasePayment;
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
        title: 'Edit',
        href: '#',
    },
];

const PurchasePaymentEdit = ({
    purchase_payment,
    purchases,
    banks,
}: PageProps) => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`Edit Pembayaran ${purchase_payment.payment_number}`}
            />
            <div className="flex flex-row items-center gap-2">
                <Link href={index().url}>
                    <ArrowLeft className="h-8 w-8" />
                </Link>
                <PageTitle title="Edit Pembayaran Pembelian" />
            </div>
            <PurchasePaymentForm
                purchase_payment={purchase_payment}
                purchases={purchases}
                banks={banks}
            />
        </AppLayout>
    );
};

export default PurchasePaymentEdit;
