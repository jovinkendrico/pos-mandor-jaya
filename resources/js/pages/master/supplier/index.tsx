import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import SupplierDeleteConfirmation from '@/components/master/suppliers/supplier-delete-confirmation';
import SupplierForm from '@/components/master/suppliers/supplier-form';
import SupplierTable from '@/components/master/suppliers/supplier-table';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/suppliers';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface City {
    id: number;
    name: string;
}

interface Supplier {
    id: number;
    name: string;
    address?: string;
    city?: City;
    city_id?: number;
    phone_number?: string;
    contact?: string;
}

interface PageProps {
    suppliers: {
        data: Supplier[];
    };
    cities: City[];
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

export default function SupplierIndex({ suppliers, cities }: PageProps) {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsFormModalOpen(true);
    };

    const handleDelete = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsDeleteModalOpen(true);
    };

    const handleFormClose = () => {
        setIsFormModalOpen(false);
        setSelectedSupplier(null);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Supplier" />
                <div className="flex justify-between">
                    <PageTitle title="Supplier" />
                    <Button onClick={() => setIsFormModalOpen(true)}>
                        <Plus />
                        Tambah Supplier
                    </Button>
                </div>
                <SupplierTable suppliers={suppliers.data} onEdit={handleEdit} onDelete={handleDelete} />
                <SupplierForm
                    isModalOpen={isFormModalOpen}
                    onOpenChange={handleFormClose}
                    supplier={selectedSupplier}
                    cities={cities}
                />
                <SupplierDeleteConfirmation
                    isModalOpen={isDeleteModalOpen}
                    onOpenChange={setIsDeleteModalOpen}
                    supplier={selectedSupplier}
                />
            </AppLayout>
        </>
    );
}

