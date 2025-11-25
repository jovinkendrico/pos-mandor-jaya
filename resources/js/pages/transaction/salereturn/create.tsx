import PageTitle from '@/components/page-title';
import SaleReturnForm from '@/components/transaction/salereturns/salereturn-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/sale-returns';
import { BreadcrumbItem, IBank, ISale } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    sales: ISale[];
    returnedQuantities?: Record<number, number>;
    banks?: IBank[];
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

export default function SaleReturnCreate({
    sales,
    returnedQuantities = {},
    banks = [],
}: PageProps) {
    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Tambah Retur Jual" />
                <div className="flex flex-row items-center gap-2">
                    <Link href={index().url}>
                        <ArrowLeft className="h-8 w-8" />
                    </Link>
                    <PageTitle title="Tambah Retur Penjualan" />
                </div>
                <SaleReturnForm
                    sales={sales}
                    returnedQuantities={returnedQuantities}
                    banks={banks}
                />
            </AppLayout>
        </>
    );
}
