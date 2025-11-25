import PageTitle from '@/components/page-title';
import SalePaymentForm from '@/components/transaction/sale-payments/sale-payment-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/sale-payments';
import { BreadcrumbItem, IBank, ISale, ISalePayment } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    sale_payment: ISalePayment;
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
        title: 'Edit',
        href: '#',
    },
];

const SalePaymentEdit = (props: PageProps) => {
    const { sale_payment, sales, banks } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Pembayaran ${sale_payment.payment_number}`} />
            <div className="flex flex-row items-center gap-2">
                <Link href={index().url}>
                    <ArrowLeft className="h-8 w-8" />
                </Link>
                <PageTitle
                    title={`Edit Pembayaran ${sale_payment.payment_number}`}
                />
            </div>
            <SalePaymentForm
                sale_payment={sale_payment}
                sales={sales}
                banks={banks}
            />
        </AppLayout>
    );
};

export default SalePaymentEdit;
