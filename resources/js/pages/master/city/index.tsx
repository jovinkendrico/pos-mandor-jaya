import CityForm from '@/components/master/cities/city-form';
import CityTable from '@/components/master/cities/city-table';
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
import { destroy as destroyCity, index } from '@/routes/cities';
import { BreadcrumbItem, ICity, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { ArrowUpDown, Search, Plus, X } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    cities: PaginatedData<ICity>;
    filters?: {
        search: string;
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
        title: 'Kota',
        href: index().url,
    },
];

const CityIndex = (props: PageProps) => {
    const {
        cities,
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

    const [selectedCity, setSelectedCity] = useState<ICity | undefined>(
        undefined,
    );

    const handleEdit = (city: ICity) => {
        setSelectedCity(city);
        openEditModal();
    };

    const handleDelete = (city: ICity) => {
        setSelectedCity(city);
        openDeleteModal();
    };

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
                <Head title="Kota" />
                <div className="flex justify-between">
                    <PageTitle title="Kota" />
                    <Button
                        onClick={() => {
                            setSelectedCity(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah Kota
                    </Button>
                </div>
                <Card className="content space-y-4 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="min-w-[200px] flex-1">
                            <Label htmlFor="search">Cari</Label>
                            <InputGroup className="input-box">
                                <InputGroupInput
                                    placeholder="Cari nama kota..."
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
                    <CityTable
                        cities={cities.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        pageFrom={cities.from}
                    />
                </div>
                {cities.data.length !== 0 && <TablePagination data={cities} />}
                <CityForm
                    isModalOpen={isEditModalOpen}
                    city={selectedCity}
                    onModalClose={closeEditModal}
                />
                <DeleteModalLayout
                    dataName={selectedCity?.name}
                    dataId={selectedCity?.id}
                    dataType="City"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedCity}
                    getDeleteUrl={(id) => destroyCity(id).url}
                />
            </AppLayout>
        </>
    );
};

export default CityIndex;
