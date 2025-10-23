import SupplierForm from '@/components/master/suppliers/supplier-form';
import SupplierTable from '@/components/master/suppliers/supplier-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroySupplier, index } from '@/routes/suppliers';
import { BreadcrumbItem, ISupplier } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface City {
    id: number;
    name: string;
}

interface PageProps {
    suppliers: {
        data: ISupplier[];
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

export default function SupplierIndex(props: PageProps) {
    const { suppliers, cities } = props;

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
                <SupplierTable
                    suppliers={suppliers.data}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
                <SupplierForm
                    isModalOpen={isEditModalOpen}
                    supplier={selectedSupplier}
                    cities={cities}
                    onModalClose={closeEditModal}
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
}
