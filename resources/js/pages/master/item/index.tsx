import ItemForm from '@/components/master/items/item-form';
import ItemTable from '@/components/master/items/item-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import FilterBar from '@/components/transaction/filter-bar';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';

import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyItem, index } from '@/routes/items';
import { BreadcrumbItem, IItem, IUOM, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    items: PaginatedData<IItem>;
    uoms: IUOM[];
    filters?: {
        search: string;
        stock_filter: string;
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
        title: 'Barang',
        href: index().url,
    },
];

const ItemIndex = (props: PageProps) => {
    const {
        items,
        uoms,
        filters = {
            search: '',
            stock_filter: 'all',
            sort_by: 'name',
            sort_order: 'asc',
        },
    } = props;

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
        isOpen: isEditModalOpen,
        openModal: openEditModal,
        closeModal: closeEditModal,
    } = useDisclosure();
    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    const [selectedItem, setSelectedItem] = useState<IItem | undefined>(
        undefined,
    );

    const handleEdit = (item: IItem) => {
        setSelectedItem(item);
        openEditModal();
    };

    const handleDelete = (item: IItem) => {
        setSelectedItem(item);
        openDeleteModal();
    };

    const handleSortOrderToggle = () => {
        const newOrder = allFilters.sort_order === 'asc' ? 'desc' : 'asc';
        handleFilterChange({ sort_order: newOrder });
    };

    const handleReset = () => {
        handleFilterChange({
            search: '',
            stock_filter: 'all',
            sort_by: 'name',
            sort_order: 'asc',
        });
    };

    const hasActiveFilters =
        allFilters.search !== '' ||
        allFilters.stock_filter !== 'all' ||
        allFilters.sort_by !== 'name' ||
        allFilters.sort_order !== 'asc';

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Barang" />
                <div className="flex justify-between">
                    <PageTitle title="Barang" />
                    <Button
                        onClick={() => {
                            setSelectedItem(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah Barang
                    </Button>
                </div>
                <FilterBar
                    filters={{ ...allFilters, search: searchTerm }}
                    onFilterChange={handleFilterChange}
                    defaultSortOrder="asc"
                    showPaymentStatus={false}
                    showDateRange={false}
                    showStatus={false}
                    sortOptions={[
                        { value: 'name', label: 'Nama' },
                        { value: 'code', label: 'Kode' },
                        { value: 'stock', label: 'Stok' },
                    ]}
                >
                    <div className="w-[180px]">
                        <Label htmlFor="stock_filter">Stok</Label>
                        <Select
                            value={allFilters.stock_filter || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange({ stock_filter: value })
                            }
                        >
                            <SelectTrigger id="stock_filter" className="combobox">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="in_stock">Ada Stok</SelectItem>
                                <SelectItem value="low">Stok Rendah (≤10)</SelectItem>
                                <SelectItem value="out">Habis</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </FilterBar>
                <div className="mt-4">
                    <ItemTable
                        items={items.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        pageFrom={items.from}
                    />
                </div>
                {items.data.length !== 0 && <TablePagination data={items} />}
                <ItemForm
                    isModalOpen={isEditModalOpen}
                    onModalClose={closeEditModal}
                    item={selectedItem}
                    uomOptions={uoms}
                />
                <DeleteModalLayout
                    dataId={selectedItem?.id}
                    dataName={selectedItem?.name}
                    dataType="Barang"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedItem}
                    getDeleteUrl={(id: number) => destroyItem(id).url}
                />
            </AppLayout>
        </>
    );
};

export default ItemIndex;
