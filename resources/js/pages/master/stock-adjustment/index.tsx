import StockAdjustmentForm from '@/components/master/stock-adjustments/stock-adjustment-form';
import StockAdjustmentTable from '@/components/master/stock-adjustments/stock-adjustment-table';
import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
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
        item_id?: string;
        adjustment_type?: string;
        sort_by?: string;
        sort_order?: string;
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
    const {
        adjustments,
        items = [],
        filters = {
            search: '',
            date_from: '',
            date_to: '',
            item_id: '',
            adjustment_type: 'all',
            sort_by: 'movement_date',
            sort_order: 'desc',
        },
    } = props;

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        {
            ...filters,
            status: 'all',
        },
    );

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
                <FilterBar
                    filters={{ ...allFilters, search: searchTerm }}
                    onFilterChange={handleFilterChange}
                    showPaymentStatus={false}
                    sortOptions={[
                        { value: 'movement_date', label: 'Tanggal' },
                        { value: 'quantity', label: 'Kuantitas' },
                        { value: 'unit_cost', label: 'Harga Satuan' },
                    ]}
                    statusOptions={[
                        { value: 'all', label: 'Semua Status' },
                    ]}
                />
                <Card className="content mt-4 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="w-[180px]">
                            <Label htmlFor="item_id">Barang</Label>
                            <Select
                                value={allFilters.item_id || undefined}
                                onValueChange={(value) =>
                                    handleFilterChange({ item_id: value || '' })
                                }
                            >
                                <SelectTrigger id="item_id" className="combobox">
                                    <SelectValue placeholder="Semua Barang" />
                                </SelectTrigger>
                                <SelectContent>
                                    {items.map((item) => (
                                        <SelectItem
                                            key={item.id}
                                            value={item.id.toString()}
                                        >
                                            {item.code} - {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[180px]">
                            <Label htmlFor="adjustment_type">Tipe Penyesuaian</Label>
                            <Select
                                value={allFilters.adjustment_type || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange({ adjustment_type: value })
                                }
                            >
                                <SelectTrigger
                                    id="adjustment_type"
                                    className="combobox"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="increase">Penambahan</SelectItem>
                                    <SelectItem value="decrease">Pengurangan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>
                <div className="mt-4">
                    <StockAdjustmentTable
                        adjustments={adjustments.data}
                        onDelete={handleDeleteClick}
                        pageFrom={adjustments.from}
                    />
                </div>
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

