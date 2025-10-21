import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import SaleTable from '@/components/transaction/sales/sale-table';
import AppLayout from '@/layouts/app-layout';
import { index, create } from '@/routes/sales';
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
    sale_date: string;
    due_date?: string;
    total_amount: string;
    total_profit: string;
    status: 'pending' | 'confirmed';
}

interface PageProps {
    sales: {
        data: Sale[];
    };
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
];

export default function SaleIndex({ sales }: PageProps) {
    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleView = (sale: Sale) => {
        router.visit(`/sales/${sale.id}`);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Penjualan" />
                <div className="flex justify-between">
                    <PageTitle title="Penjualan" />
                    <Button onClick={handleCreate}>
                        <Plus />
                        Tambah Penjualan
                    </Button>
                </div>
                <SaleTable sales={sales.data} onView={handleView} />
            </AppLayout>
        </>
    );
}

