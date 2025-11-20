import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import PurchaseTable from '@/components/transaction/purchases/purchase-table';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { create, destroy as destroyPurchase, index } from '@/routes/purchases';
import {
    BreadcrumbItem,
    PageProps as InertiaPageProps,
    IPurchase,
    PaginatedData,
} from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface PageProps {
    purchases: PaginatedData<IPurchase>;
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
        title: 'Pembelian',
        href: index().url,
    },
];

const PurchaseIndex = (props: PageProps) => {
    const {
        purchases,
        filters = {
            search: '',
            status: 'all',
            payment_status: 'all',
            date_from: '',
            date_to: '',
            sort_by: 'purchase_date',
            sort_order: 'desc',
        },
    } = props;
    const { flash } = usePage<InertiaPageProps>().props;

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const [selectedPurchase, setSelectedPurchase] = useState<
        IPurchase | undefined
    >(undefined);

    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    useMemo(() => {
        if (
            flash?.success === 'Pembelian berhasil ditambahkan.' ||
            flash?.success === 'Pembelian berhasil diperbarui.'
        ) {
            toast.success(flash.success);
        }
    }, [flash]);

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleDelete = (purchase: IPurchase) => {
        setSelectedPurchase(purchase);
        openDeleteModal();
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Pembelian" />
                <div className="flex justify-between">
                    <PageTitle title="Pembelian" />
                    <Button onClick={handleCreate} className="btn-primary">
                        <Plus />
                        Tambah Pembelian
                    </Button>
                </div>
                <FilterBar
                    filters={{ ...allFilters, search: searchTerm }}
                    onFilterChange={handleFilterChange}
                    sortOptions={[
                        { value: 'purchase_date', label: 'Tanggal' },
                        { value: 'purchase_number', label: 'No. Pembelian' },
                        { value: 'total_amount', label: 'Total' },
                        { value: 'status', label: 'Status' },
                    ]}
                />

                <div className="mt-4">
                    <PurchaseTable
                        purchases={purchases.data}
                        pageFrom={purchases.from}
                        onDelete={handleDelete}
                    />
                </div>
                {purchases.data.length !== 0 && (
                    <TablePagination data={purchases} />
                )}

                <DeleteModalLayout
                    dataName={selectedPurchase?.purchase_number}
                    dataId={selectedPurchase?.id}
                    dataType="Pembelian"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedPurchase}
                    getDeleteUrl={(id) => destroyPurchase(id).url}
                />
            </AppLayout>
        </>
    );
};

export default PurchaseIndex;
