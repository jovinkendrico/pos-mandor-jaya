import AppLayout from '@/layouts/app-layout';
import PurchaseReturnForm from '@/components/transaction/purchasereturns/purchasereturn-form';
import { IPurchase, IBank, BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index as purchaseReturnIndex } from '@/routes/purchase-returns';

interface EditProps {
    purchaseReturn: any;
    purchases: IPurchase[];
    banks: IBank[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Retur Beli',
        href: purchaseReturnIndex().url,
    },
    {
        title: 'Edit Retur Beli',
        href: '#',
    },
];

export default function Edit({ purchaseReturn, purchases, banks }: EditProps) {
    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
        >
            <Head title={`Edit Retur Pembelian ${purchaseReturn.return_number}`} />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href={purchaseReturnIndex().url}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Edit Retur Pembelian: {purchaseReturn.return_number}
                    </h2>
                </div>
            </div>

            <div className="mx-auto max-w-7xl">
                <PurchaseReturnForm
                    purchases={purchases}
                    banks={banks}
                    initialData={purchaseReturn}
                />
            </div>
        </AppLayout>
    );
}
