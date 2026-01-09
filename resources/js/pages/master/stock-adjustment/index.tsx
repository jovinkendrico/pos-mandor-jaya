import { usePermission } from '@/hooks/use-permission';
import StockAdjustmentForm from '@/components/master/stock-adjustments/stock-adjustment-form';
import StockAdjustmentTable from '@/components/master/stock-adjustments/stock-adjustment-table';
import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';

import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { destroy, index } from '@/routes/stock-adjustments';
import {
    BreadcrumbItem,
    IItem,
    IStockAdjustment,
    PaginatedData,
} from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    adjustments: PaginatedData<IStockAdjustment>;
    items?: IItem[];
    filters?: {
        search: string;
        status: string;
        date_from: string;
        date_to: string;
        item_id: string;
        adjustment_type: string;
        sort_by: string;
        sort_order: string;
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
            status: 'all',
            date_from: '',
            date_to: '',
            item_id: '',
            adjustment_type: 'all',
            sort_by: 'movement_date',
            sort_order: 'desc',
        },
    } = props;
    const { hasPermission } = usePermission();

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        {
            ...filters,
            status: 'all',
            date_from: '',
            date_to: '',
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

    const [selectedAdjustment, setSelectedAdjustment] = useState<
        IStockAdjustment | undefined
    >(undefined);

    const handleDeleteClick = (adjustment: IStockAdjustment) => {
        setSelectedAdjustment(adjustment);
        openDeleteModal();
    };

    const itemOptions = items.map((item) => ({
        value: item.id.toString(),
        label: `${item.code} - ${item.name}`,
    }));

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Penyesuaian Stok" />
                <div className="flex justify-between">
                    <PageTitle title="Penyesuaian Stok" />
                    {hasPermission('stock-adjustments.create') && (
                        <Button
                            onClick={() => {
                                openFormModal();
                            }}
                            className="btn-primary"
                        >
                            <Plus />
                            Tambah Penyesuaian
                        </Button>
                    )}
                </div>
                <FilterBar
                    filters={{ ...allFilters, search: searchTerm }}
                    onFilterChange={handleFilterChange}
                    showPaymentStatus={false}
                    showStatus={false}
                    sortOptions={[
                        { value: 'movement_date', label: 'Tanggal' },
                        { value: 'quantity', label: 'Kuantitas' },
                        { value: 'unit_cost', label: 'Harga Satuan' },
                    ]}
                >
                    <div className="w-[180px]">
                        <Label htmlFor="item_id">Barang</Label>
                        <Combobox
                            options={itemOptions}
                            value={allFilters.item_id || ''}
                            onValueChange={(value) =>
                                handleFilterChange({ item_id: value })
                            }
                            placeholder="Pilih Barang"
                            searchPlaceholder="Cari barang..."
                            className="combobox"
                        />
                    </div>
                    <div className="w-[180px]">
                        <Label htmlFor="adjustment_type">
                            Tipe Penyesuaian
                        </Label>
                        <Select
                            value={allFilters.adjustment_type || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange({
                                    adjustment_type: value,
                                })
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
                                <SelectItem value="increase">
                                    Penambahan
                                </SelectItem>
                                <SelectItem value="decrease">
                                    Pengurangan
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </FilterBar>
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
