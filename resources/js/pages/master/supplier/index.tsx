import SupplierForm from '@/components/master/suppliers/supplier-form';
import SupplierTable from '@/components/master/suppliers/supplier-table';
import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import { Label } from '@/components/ui/label';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useCity from '@/hooks/use-city';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroySupplier, index } from '@/routes/suppliers';
import { BreadcrumbItem, City, ISupplier, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PageProps {
    suppliers: PaginatedData<ISupplier>;
    cities?: City[];
    filters?: {
        search: string;
        city_id: string;
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
        title: 'Supplier',
        href: index().url,
    },
];

const SupplierIndex = (props: PageProps) => {
    const {
        suppliers,
        cities = [],
        filters = {
            search: '',
            city_id: '',
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

    const { getCityData } = useCity();
    const [cityOptions, setCityOptions] = useState<ComboboxOption[]>([]);

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

    const [selectedSupplier, setSelectedSupplier] = useState<
        ISupplier | undefined
    >(undefined);

    const handleEdit = (supplier: ISupplier) => {
        setSelectedSupplier(supplier);
        openEditModal();
    };

    const handleDelete = (supplier: ISupplier) => {
        setSelectedSupplier(supplier);
        openDeleteModal();
    };

    useEffect(() => {
        const fetchCityData = async () => {
            const response = await getCityData();
            setCityOptions(response);
        };
        fetchCityData();
    }, [getCityData]);

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Supplier" />
                <div className="flex justify-between">
                    <PageTitle title="Supplier" />
                    <Button
                        onClick={() => {
                            setSelectedSupplier(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah Supplier
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
                        { value: 'city', label: 'Kota' },
                        { value: 'phone_number', label: 'Telepon' },
                    ]}
                >
                    <div className="w-[180px]">
                        <Label htmlFor="city_id">Kota</Label>
                        <Combobox
                            options={cities.map((city) => ({
                                value: city.id.toString(),
                                label: city.name,
                            }))}
                            value={allFilters.city_id || ''}
                            onValueChange={(value) =>
                                handleFilterChange({ city_id: value })
                            }
                            placeholder="Pilih Kota"
                            searchPlaceholder="Cari kota..."
                            className="w-full"
                        />
                    </div>
                </FilterBar>
                <div className="mt-4">
                    <SupplierTable
                        suppliers={suppliers.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        pageFrom={suppliers.from}
                    />
                </div>
                {suppliers.data.length !== 0 && (
                    <TablePagination data={suppliers} />
                )}
                <SupplierForm
                    isModalOpen={isEditModalOpen}
                    supplier={selectedSupplier}
                    onModalClose={closeEditModal}
                    cityComboboxOption={cityOptions}
                />
                <DeleteModalLayout
                    dataId={selectedSupplier?.id}
                    dataName={selectedSupplier?.name}
                    dataType="Supplier"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedSupplier}
                    getDeleteUrl={(id) => destroySupplier(id).url}
                />
            </AppLayout>
        </>
    );
};

export default SupplierIndex;
