import CustomerForm from '@/components/master/customers/customer-form';
import CustomerTable from '@/components/master/customers/customer-table';
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
import customerRoutes, { destroy as destroyCustomer, index } from '@/routes/customers';
import { BreadcrumbItem, City, ICustomer, PageProps as GlobalPageProps, PaginatedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CustomerPageProps {
    customers: PaginatedData<ICustomer>;
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
        title: 'Customer',
        href: index().url,
    },
];

const CustomerIndex = (props: CustomerPageProps) => {
    const {
        customers,
        cities = [],
        filters = {
            search: '',
            city_id: '',
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

    const { getCityData } = useCity();
    const [cityOptions, setCityOptions] = useState<ComboboxOption[]>([]);

    const [selectedCustomer, setSelectedCustomer] = useState<
        ICustomer | undefined
    >(undefined);

    const handleEdit = (customer: ICustomer) => {
        setSelectedCustomer(customer);
        openEditModal();
    };

    const handleDelete = (customer: ICustomer) => {
        setSelectedCustomer(customer);
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
                <Head title="Customer" />
                <div className="flex justify-between">
                    <PageTitle title="Customer" />
                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                router.visit(customerRoutes.import().url);
                            }}
                            variant="outline"
                            className="btn-secondary"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import
                        </Button>
                        {canCreate && (
                            <Button
                                onClick={() => {
                                    setSelectedCustomer(undefined);
                                    openEditModal();
                                }}
                                className="btn-primary"
                            >
                                <Plus />
                                Tambah Customer
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
                            className="combobox"
                        />
                    </div>
                </FilterBar>
                <div className="mt-4">
                    <CustomerTable
                        customers={customers.data}
                        onEdit={canEdit ? handleEdit : undefined}
                        onDelete={canDelete ? handleDelete : undefined}
                        pageFrom={customers.from}
                    />
                </div>
                {customers.data.length !== 0 && (
                    <TablePagination data={customers} />
                )}
                <CustomerForm
                    isModalOpen={isEditModalOpen}
                    customer={selectedCustomer}
                    onModalClose={closeEditModal}
                    cityComboboxOption={cityOptions}
                />
                <DeleteModalLayout
                    dataName={selectedCustomer?.name}
                    dataId={selectedCustomer?.id}
                    dataType="Customer"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedCustomer}
                    getDeleteUrl={(id) => destroyCustomer(id).url}
                />
            </AppLayout>
        </>
    );
};

export default CustomerIndex;
