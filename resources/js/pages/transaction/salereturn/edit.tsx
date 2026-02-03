import AppLayout from '@/layouts/app-layout';
import SaleReturnForm from '@/components/transaction/salereturns/salereturn-form';
import { ISale, IBank, BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index as saleReturnIndex } from '@/routes/sale-returns';

interface EditProps {
    saleReturn: any;
    sales: ISale[];
    banks: IBank[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Retur Jual',
        href: saleReturnIndex().url,
    },
    {
        title: 'Edit Retur Jual',
        href: '#',
    },
];

export default function Edit({ saleReturn, sales, banks }: EditProps) {
    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
        >
            <Head title={`Edit Retur Penjualan ${saleReturn.return_number}`} />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href={saleReturnIndex().url}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Edit Retur Penjualan: {saleReturn.return_number}
                    </h2>
                </div>
            </div>

            <div className="mx-auto max-w-7xl">
                <SaleReturnForm
                    sales={sales}
                    banks={banks}
                    initialData={saleReturn}
                />
            </div>
        </AppLayout>
    );
}
