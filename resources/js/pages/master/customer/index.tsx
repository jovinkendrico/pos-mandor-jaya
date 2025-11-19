import CustomerForm from '@/components/master/customers/customer-form';
import CustomerTable from '@/components/master/customers/customer-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { ComboboxOption } from '@/components/ui/combobox';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useCity from '@/hooks/use-city';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyCustomer, index } from '@/routes/customers';
import { BreadcrumbItem, ICustomer, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PageProps {
    customers: PaginatedData<ICustomer>;
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
    const { customers } = props;

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
                <CustomerTable
                    customers={customers.data}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    pageFrom={customers.from}
                />
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
