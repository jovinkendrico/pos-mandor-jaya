import UOMForm from '@/components/master/uom/uom-form';
import UOMTable from '@/components/master/uom/uom-table';
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
import { destroy as destroyUOM, index } from '@/routes/uoms';
import { BreadcrumbItem, IUOM, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { ArrowUpDown, Search, Plus, X } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'UOM',
        href: index().url,
    },
];

interface UOMProps {
    uoms: PaginatedData<IUOM>;
    filters?: {
        search: string;
        sort_by: string;
        sort_order: string;
    };
}

const UOMPage = (props: UOMProps) => {
    const {
        uoms,
        filters = {
            search: '',
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

    const [selectedUOM, setSelectedUOM] = useState<IUOM | undefined>(undefined);

    const handleEdit = (uom: IUOM) => {
        setSelectedUOM(uom);
        openEditModal();
    };

    const handleDelete = (uom: IUOM) => {
        setSelectedUOM(uom);
        openDeleteModal();
    };

    const handleSortOrderToggle = () => {
        const newOrder = allFilters.sort_order === 'asc' ? 'desc' : 'asc';
        handleFilterChange({ sort_order: newOrder });
    };

    const handleReset = () => {
        handleFilterChange({
            search: '',
            sort_by: 'name',
            sort_order: 'asc',
        });
    };

    const hasActiveFilters =
        allFilters.search !== '' ||
        allFilters.sort_by !== 'name' ||
        allFilters.sort_order !== 'asc';

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="UOM" />
                <div className="flex justify-between">
                    <PageTitle title="UOM" />
                    <Button
                        onClick={() => {
                            setSelectedUOM(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah UOM
                    </Button>
                </div>
                <Card className="content space-y-4 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="min-w-[200px] flex-1">
                            <Label htmlFor="search">Cari</Label>
                            <InputGroup className="input-box">
                                <InputGroupInput
                                    placeholder="Cari nama UOM..."
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
                    <UOMTable
                        uoms={uoms.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        pageFrom={uoms.from}
                    />
                </div>
                {uoms.data.length !== 0 && <TablePagination data={uoms} />}
                <UOMForm
                    isModalOpen={isEditModalOpen}
                    onModalClose={closeEditModal}
                    uom={selectedUOM}
                />
                <DeleteModalLayout
                    dataId={selectedUOM?.id}
                    dataName={selectedUOM?.name}
                    dataType="UOM"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedUOM}
                    getDeleteUrl={(id: number) => destroyUOM(id).url}
                />
            </AppLayout>
        </>
    );
};

export default UOMPage;
