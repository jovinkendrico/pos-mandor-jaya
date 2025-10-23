import CustomerForm from '@/components/master/customers/customer-form';
import CustomerTable from '@/components/master/customers/customer-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/customers';
import { BreadcrumbItem, ICity, ICustomer } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    customers: {
        data: ICustomer[];
    };
    cities: ICity[];
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

export default function CustomerIndex(props: PageProps) {
    const { customers, cities } = props;

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
                />
                <CustomerForm
                    isModalOpen={isEditModalOpen}
                    customer={selectedCustomer}
                    cities={cities}
                    onModalClose={closeEditModal}
                />
                <DeleteModalLayout
                    dataName={selectedCustomer?.name}
                    dataId={selectedCustomer?.id}
                    dataType="Customer"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedCustomer}
                />
            </AppLayout>
        </>
    );
}
