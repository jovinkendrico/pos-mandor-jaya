import CityForm from '@/components/master/cities/city-form';
import CityTable from '@/components/master/cities/city-table';
import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyCity, index } from '@/routes/cities';
import { BreadcrumbItem, ICity, PageProps as GlobalPageProps, PaginatedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface CityPageProps {
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

const CityIndex = (props: CityPageProps) => {
    const {
        cities,
        filters = {
            search: '',
            sort_by: 'name',
            sort_order: 'asc',
        },
    } = props;

    const { auth } = usePage<GlobalPageProps>().props;
    const canCreate = auth.permissions.includes('master.create');
    const canEdit = auth.permissions.includes('master.edit');
    const canDelete = auth.permissions.includes('master.delete');

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

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Kota" />
                <div className="flex justify-between">
                    <PageTitle title="Kota" />
                    {canCreate && (
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
                    )}
                </div>
                <FilterBar
                    filters={{ ...allFilters, search: searchTerm }}
                    onFilterChange={handleFilterChange}
                    defaultSortOrder="asc"
                    showPaymentStatus={false}
                    showDateRange={false}
                    showStatus={false}
                    sortOptions={[{ value: 'name', label: 'Nama' }]}
                />
                <div className="mt-4">
                    <CityTable
                        cities={cities.data}
                        onEdit={canEdit ? handleEdit : undefined}
                        onDelete={canDelete ? handleDelete : undefined}
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
