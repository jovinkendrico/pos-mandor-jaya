import PageTitle from '@/components/page-title';
import CashInTable from '@/components/transaction/cash-ins/cash-in-table';
import { Button } from '@/components/ui/button';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, CashIn, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface PageProps {
    cashIns: PaginatedData<CashIn>;
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
        title: 'Kas Masuk',
        href: '/cash-ins',
    },
];

export default function CashInIndex({ cashIns, filters = {} }: PageProps) {
    const handleCreate = () => {
        router.visit('/cash-ins/create');
    };

    const handleView = (cashIn: CashIn) => {
        router.visit(`/cash-ins/${cashIn.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kas Masuk" />
            <div className="flex justify-between">
                <PageTitle title="Kas Masuk" />
                <Button onClick={handleCreate} className="btn-primary">
                    <Plus />
                    Tambah Kas Masuk
                </Button>
            </div>
            <CashInTable cashIns={cashIns.data} onView={handleView} />
            {cashIns.data.length !== 0 && <TablePagination data={cashIns} />}
        </AppLayout>
    );
}

