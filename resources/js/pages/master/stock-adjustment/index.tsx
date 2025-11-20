import StockAdjustmentForm from '@/components/master/stock-adjustments/stock-adjustment-form';
import StockAdjustmentTable from '@/components/master/stock-adjustments/stock-adjustment-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { destroy, index } from '@/routes/stock-adjustments';
import { BreadcrumbItem, IItem, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import useStockAdjustment from '@/hooks/use-stock-adjustment';

interface StockAdjustment {
    id: number;
    item_id: number;
    item?: {
        id: number;
        name: string;
        code?: string;
    };
    quantity: number;
    unit_cost: number;
    movement_date: string;
    notes?: string;
    created_at: string;
}

interface PageProps {
    adjustments: PaginatedData<StockAdjustment>;
    items?: IItem[];
    filters?: {
        search?: string;
        date_from?: string;
        date_to?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'Penyesuaian Stok',
        href: index().url,
    },
];

const StockAdjustmentIndex = (props: PageProps) => {
    const { adjustments, items = [], filters = {} } = props;

    const {
        isOpen: isFormModalOpen,
        openModal: openFormModal,
        closeModal: closeFormModal,
    } = useDisclosure();
    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | undefined>(
        undefined,
    );

    const handleDeleteClick = (adjustment: StockAdjustment) => {
        setSelectedAdjustment(adjustment);
        openDeleteModal();
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Penyesuaian Stok" />
                <div className="flex justify-between">
                    <PageTitle title="Penyesuaian Stok" />
                    <Button
                        onClick={() => {
                            openFormModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah Penyesuaian
                    </Button>
                </div>
                <StockAdjustmentTable
                    adjustments={adjustments.data}
                    onDelete={handleDeleteClick}
                    pageFrom={adjustments.from}
                />
                {adjustments.data.length !== 0 && (
                    <TablePagination data={adjustments} />
                )}
                <StockAdjustmentForm
                    isModalOpen={isFormModalOpen}
                    onModalClose={closeFormModal}
                    items={items}
                />
                <DeleteModalLayout
                    dataId={selectedAdjustment?.id}
                    dataName={`Penyesuaian Stok - ${selectedAdjustment?.item?.name || ''}`}
                    dataType="Penyesuaian Stok"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedAdjustment}
                    getDeleteUrl={(id: number) => destroy(id).url}
                />
            </AppLayout>
        </>
    );
};

export default StockAdjustmentIndex;

