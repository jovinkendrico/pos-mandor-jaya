import VehicleForm from '@/components/master/vehicles/vehicle-form';
import VehicleTable from '@/components/master/vehicles/vehicle-table';
import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyVehicle, index } from '@/routes/vehicles';
import { BreadcrumbItem, IVehicle, PageProps as GlobalPageProps, PaginatedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface VehiclePageProps {
    vehicles: PaginatedData<IVehicle>;
    filters?: {
        search: string;
        is_active: string;
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
        title: 'Kendaraan',
        href: index().url,
    },
];

const VehicleIndex = (props: VehiclePageProps) => {
    const {
        vehicles,
        filters = {
            search: '',
            is_active: '',
            sort_by: 'police_number',
            sort_order: 'asc',
        },
    } = props;

    const { auth } = usePage<GlobalPageProps>().props;
    // Assuming you will create permissions for vehicles. Using generic here or specific if available
    const canCreate = auth.permissions.includes('vehicles.create');
    const canEdit = auth.permissions.includes('vehicles.edit');
    const canDelete = auth.permissions.includes('vehicles.delete');

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        {
            ...filters,
            status: 'all',
            date_from: '',
            date_to: '',
        },
    );

    const [selectedVehicle, setSelectedVehicle] = useState<
        IVehicle | undefined
    >(undefined);

    const handleEdit = (vehicle: IVehicle) => {
        setSelectedVehicle(vehicle);
        openEditModal();
    };

    const handleDelete = (vehicle: IVehicle) => {
        setSelectedVehicle(vehicle);
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
                <Head title="Kendaraan" />
                <div className="flex justify-between">
                    <PageTitle title="Kendaraan" />
                    <div className="flex gap-2">
                        {canCreate && (
                            <Button
                                onClick={() => {
                                    setSelectedVehicle(undefined);
                                    openEditModal();
                                }}
                                className="btn-primary"
                            >
                                <Plus />
                                Tambah Kendaraan
                            </Button>
                        )}
                    </div>
                </div>
                <FilterBar
                    filters={{ ...allFilters, search: searchTerm }}
                    onFilterChange={handleFilterChange}
                    defaultSortOrder="asc"
                    showPaymentStatus={false}
                    showDateRange={false}
                    showStatus={false}
                    sortOptions={[
                        { value: 'police_number', label: 'Nomor Polisi (BK)' },
                        { value: 'name', label: 'Nama Truk' },
                        { value: 'driver', label: 'Supir' },
                    ]}
                >
                </FilterBar>
                <div className="mt-4">
                    <VehicleTable
                        vehicles={vehicles.data}
                        onEdit={canEdit ? handleEdit : undefined}
                        onDelete={canDelete ? handleDelete : undefined}
                        pageFrom={vehicles.from}
                    />
                </div>
                {vehicles.data.length !== 0 && (
                    <TablePagination data={vehicles} />
                )}
                <VehicleForm
                    isModalOpen={isEditModalOpen}
                    vehicle={selectedVehicle}
                    onModalClose={closeEditModal}
                />
                <DeleteModalLayout
                    dataName={selectedVehicle?.police_number}
                    dataId={selectedVehicle?.id}
                    dataType="Kendaraan"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedVehicle}
                    getDeleteUrl={(id) => destroyVehicle(id).url}
                />
            </AppLayout>
        </>
    );
};

export default VehicleIndex;
