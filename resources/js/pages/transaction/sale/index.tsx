import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import SaleTable from '@/components/transaction/sales/sale-table';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { create, destroy as destroySale, index } from '@/routes/sales';
import { BreadcrumbItem, ISale, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    sales: PaginatedData<ISale>;
    filters?: {
        search: string;
        status: string;
        payment_status: string;
        date_from: string;
        date_to: string;
        sort_by: string;
        sort_order: string;
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

const SaleIndex = (props: PageProps) => {
    const {
        sales,
        filters = {
            search: '',
            status: 'all',
            payment_status: 'all',
            date_from: '',
            date_to: '',
            sort_by: 'sale_date',
            sort_order: 'desc',
        },
    } = props;

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const [selectedSale, setSelectedSale] = useState<ISale | undefined>(
        undefined,
    );

    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleDelete = (sale: ISale) => {
        setSelectedSale(sale);
        openDeleteModal();
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Penjualan" />
                <div className="flex justify-between">
                    <PageTitle title="Penjualan" />
                    <Button onClick={handleCreate} className="btn-primary">
                        <Plus />
                        Tambah Penjualan
                    </Button>
                </div>
                <FilterBar
                    filters={{ ...allFilters, search: searchTerm }}
                    onFilterChange={handleFilterChange}
                    sortOptions={[
                        { value: 'sale_date', label: 'Tanggal' },
                        { value: 'sale_number', label: 'Nomor Penjualan' },
                        { value: 'total_amount', label: 'Total' },
                        { value: 'status', label: 'Status' },
                    ]}
                />
                <div className="mt-4">
                    <SaleTable sales={sales.data} onDelete={handleDelete} />
                </div>
                <DeleteModalLayout
                    dataName={selectedSale?.sale_number}
                    dataId={selectedSale?.id}
                    dataType="Penjualan"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedSale}
                    getDeleteUrl={(id) => destroySale(id).url}
                />
            </AppLayout>
        </>
    );
};

export default SaleIndex;
