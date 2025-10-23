import UOMForm from '@/components/master/uom/uom-form';
import UOMTable from '@/components/master/uom/uom-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/uoms';
import { BreadcrumbItem, UOM } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'UOM',
        href: index().url,
    },
];

interface UOMProps {
    uoms: UOM[];
}

const UOMPage = (props: UOMProps) => {
    const { uoms } = props;

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

    const [selectedUOM, setSelectedUOM] = useState<UOM | undefined>(undefined);

    const handleEdit = (uom: UOM) => {
        setSelectedUOM(uom);
        openEditModal();
    };

    const handleDelete = (uom: UOM) => {
        setSelectedUOM(uom);
        openDeleteModal();
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="UOM" />
                <div className="flex justify-between">
                    <PageTitle title="UOM" />
                    <Button
                        onClick={() => {
                            setSelectedUOM(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah UOM
                    </Button>
                </div>
                <UOMTable
                    uoms={uoms}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
                <UOMForm
                    isModalOpen={isEditModalOpen}
                    onModalClose={closeEditModal}
                    uom={selectedUOM}
                />
                <DeleteModalLayout
                    dataId={selectedUOM?.id}
                    dataName={selectedUOM?.name}
                    dataType="UOM"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedUOM}
                />
            </AppLayout>
        </>
    );
};

export default UOMPage;
