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
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Card } from '@/components/ui/card';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyItem, index } from '@/routes/items';
import { BreadcrumbItem, IItem, IUOM, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { ArrowUpDown, Search, Plus, X } from 'lucide-react';
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
                <Card className="content space-y-4 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="min-w-[200px] flex-1">
                            <Label htmlFor="search">Cari</Label>
                            <InputGroup className="input-box">
                                <InputGroupInput
                                    placeholder="Cari kode, nama..."
                                    className=""
                                    id="search"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        handleFilterChange({ search: e.target.value })
                                    }
                                />
                                <InputGroupAddon>
                                    <Search />
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
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
                        <div className="w-[180px]">
                            <Label htmlFor="sort_by">Urutkan</Label>
                            <div className="flex gap-2">
                                <Select
                                    value={allFilters.sort_by}
                                    onValueChange={(value) =>
                                        handleFilterChange({ sort_by: value })
                                    }
                                >
                                    <SelectTrigger id="sort_by" className="combobox">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name">Nama</SelectItem>
                                        <SelectItem value="code">Kode</SelectItem>
                                        <SelectItem value="stock">Stok</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleSortOrderToggle}
                                    title={
                                        allFilters.sort_order === 'asc'
                                            ? 'Urutkan Naik'
                                            : 'Urutkan Turun'
                                    }
                                    className="btn-secondary"
                                >
                                    <ArrowUpDown className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="btn-danger"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                        )}
                    </div>
                </Card>
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
