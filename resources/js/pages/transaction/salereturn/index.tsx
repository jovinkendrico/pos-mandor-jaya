import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import SaleReturnTable from '@/components/transaction/salereturns/salereturn-table';
import AppLayout from '@/layouts/app-layout';
import { index, create } from '@/routes/sale-returns';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface Customer {
    id: number;
    name: string;
}

interface Sale {
    id: number;
    sale_number: string;
    customer?: Customer;
}

interface SaleReturn {
    id: number;
    return_number: string;
    sale: Sale;
    return_date: string;
    total_amount: string;
    total_profit_adjustment: string;
    status: 'pending' | 'confirmed';
}

interface PageProps {
    returns: {
        data: SaleReturn[];
    };
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
];

export default function SaleReturnIndex({ returns }: PageProps) {
    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleView = (returnData: SaleReturn) => {
        router.visit(`/sale-returns/${returnData.id}`);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Retur Jual" />
                <div className="flex justify-between">
                    <PageTitle title="Retur Penjualan" />
                    <Button onClick={handleCreate}>
                        <Plus />
                        Tambah Retur Jual
                    </Button>
                </div>
                <SaleReturnTable returns={returns.data} onView={handleView} />
            </AppLayout>
        </>
    );
}

