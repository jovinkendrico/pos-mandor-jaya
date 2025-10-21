import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import CustomerDeleteConfirmation from '@/components/master/customers/customer-delete-confirmation';
import CustomerForm from '@/components/master/customers/customer-form';
import CustomerTable from '@/components/master/customers/customer-table';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/customers';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface City {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    address?: string;
    city?: City;
    city_id?: number;
    phone_number?: string;
    contact?: string;
}

interface PageProps {
    customers: {
        data: Customer[];
    };
    cities: City[];
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

export default function CustomerIndex({ customers, cities }: PageProps) {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsFormModalOpen(true);
    };

    const handleDelete = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDeleteModalOpen(true);
    };

    const handleFormClose = () => {
        setIsFormModalOpen(false);
        setSelectedCustomer(null);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Customer" />
                <div className="flex justify-between">
                    <PageTitle title="Customer" />
                    <Button onClick={() => setIsFormModalOpen(true)}>
                        <Plus />
                        Tambah Customer
                    </Button>
                </div>
                <CustomerTable customers={customers.data} onEdit={handleEdit} onDelete={handleDelete} />
                <CustomerForm
                    isModalOpen={isFormModalOpen}
                    onOpenChange={handleFormClose}
                    customer={selectedCustomer}
                    cities={cities}
                />
                <CustomerDeleteConfirmation
                    isModalOpen={isDeleteModalOpen}
                    onOpenChange={setIsDeleteModalOpen}
                    customer={selectedCustomer}
                />
            </AppLayout>
        </>
    );
}

