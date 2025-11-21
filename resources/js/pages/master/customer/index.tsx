import CustomerForm from '@/components/master/customers/customer-form';
import CustomerTable from '@/components/master/customers/customer-table';
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
import { ComboboxOption } from '@/components/ui/combobox';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useCity from '@/hooks/use-city';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyCustomer, index } from '@/routes/customers';
import { BreadcrumbItem, ICustomer, PaginatedData, City } from '@/types';
import { Head } from '@inertiajs/react';
import { ArrowUpDown, Search, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PageProps {
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

const CustomerIndex = (props: PageProps) => {
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

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
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

    const handleSortOrderToggle = () => {
        const newOrder = allFilters.sort_order === 'asc' ? 'desc' : 'asc';
        handleFilterChange({ sort_order: newOrder });
    };

    const handleReset = () => {
        handleFilterChange({
            search: '',
            city_id: '',
            sort_by: 'name',
            sort_order: 'asc',
        });
    };

    const hasActiveFilters =
        allFilters.search !== '' ||
        allFilters.city_id !== '' ||
        allFilters.sort_by !== 'name' ||
        allFilters.sort_order !== 'asc';

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
                </div>
                <Card className="content space-y-4 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="min-w-[200px] flex-1">
                            <Label htmlFor="search">Cari</Label>
                            <InputGroup className="input-box">
                                <InputGroupInput
                                    placeholder="Cari nama, alamat, telepon..."
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
                            <Label htmlFor="city_id">Kota</Label>
                            <Select
                                value={allFilters.city_id || undefined}
                                onValueChange={(value) =>
                                    handleFilterChange({ city_id: value || '' })
                                }
                            >
                                <SelectTrigger id="city_id" className="combobox">
                                    <SelectValue placeholder="Semua Kota" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cities.map((city) => (
                                        <SelectItem
                                            key={city.id}
                                            value={city.id.toString()}
                                        >
                                            {city.name}
                                        </SelectItem>
                                    ))}
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
                                        <SelectItem value="city">Kota</SelectItem>
                                        <SelectItem value="phone_number">
                                            Telepon
                                        </SelectItem>
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
                    <CustomerTable
                        customers={customers.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
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
