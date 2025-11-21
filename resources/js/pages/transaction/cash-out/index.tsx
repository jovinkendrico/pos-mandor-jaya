import PageTitle from '@/components/page-title';
import CashOutTable from '@/components/transaction/cash-outs/cash-out-table';
import { Button } from '@/components/ui/button';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, CashOut, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface PageProps {
    cashOuts: PaginatedData<CashOut>;
    filters?: {
        search: string;
        date_from: string;
        date_to: string;
        status: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Kas Keluar',
        href: '/cash-outs',
    },
];

export default function CashOutIndex({ cashOuts, filters = {} }: PageProps) {
    const handleCreate = () => {
        router.visit('/cash-outs/create');
    };

    const handleView = (cashOut: CashOut) => {
        router.visit(`/cash-outs/${cashOut.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kas Keluar" />
            <div className="flex justify-between">
                <PageTitle title="Kas Keluar" />
                <Button onClick={handleCreate} className="btn-primary">
                    <Plus />
                    Tambah Kas Keluar
                </Button>
            </div>
            <CashOutTable cashOuts={cashOuts.data} onView={handleView} />
            {cashOuts.data.length !== 0 && <TablePagination data={cashOuts} />}
        </AppLayout>
    );
}

