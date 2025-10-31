import ItemForm from '@/components/master/items/item-form';
import ItemTable from '@/components/master/items/item-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyItem, index } from '@/routes/items';
import { BreadcrumbItem, IItem, IUOM } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    items: {
        data: IItem[];
    };
    uoms: IUOM[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'Barang',
        href: index().url,
    },
];

export default function ItemIndex(props: PageProps) {
    const { items, uoms } = props;

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

    const [selectedItem, setSelectedItem] = useState<IItem | undefined>(
        undefined,
    );

    const handleEdit = (item: IItem) => {
        setSelectedItem(item);
        openEditModal();
    };

    const handleDelete = (item: IItem) => {
        setSelectedItem(item);
        openDeleteModal();
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Barang" />
                <div className="flex justify-between">
                    <PageTitle title="Barang" />
                    <Button
                        onClick={() => {
                            setSelectedItem(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah Barang
                    </Button>
                </div>
                <ItemTable
                    items={items.data}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
                <ItemForm
                    isModalOpen={isEditModalOpen}
                    onModalClose={closeEditModal}
                    item={selectedItem}
                    uomOptions={uoms}
                />
                <DeleteModalLayout
                    dataId={selectedItem?.id}
                    dataName={selectedItem?.name}
                    dataType="Barang"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedItem}
                    getDeleteUrl={(id: number) => destroyItem(id).url}
                />
            </AppLayout>
        </>
    );
}
