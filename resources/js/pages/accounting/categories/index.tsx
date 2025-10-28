import CategoryForm from '@/components/accounting/categories/category-form';
import CategoryTable from '@/components/accounting/categories/category-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyCategory, index } from '@/routes/categories';
import { BreadcrumbItem, ICategory } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    categories: {
        data: ICategory[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounting',
        href: '#',
    },
    {
        title: 'Categories',
        href: index().url,
    },
];

export default function CategoryIndex({ categories }: PageProps) {
    const [selectedCategory, setSelectedCategory] = useState<ICategory | undefined>(
        undefined,
    );

    const handleEdit = (category: ICategory) => {
        setSelectedCategory(category);
        openEditModal();
    };

    const handleDelete = (category: ICategory) => {
        setSelectedCategory(category);
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
                <Head title="Categories" />
                <div className="flex justify-between">
                    <PageTitle title="Categories" />
                    <Button
                        onClick={() => {
                            setSelectedCategory(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah Kategori
                    </Button>
                </div>
                <CategoryTable
                    categories={categories.data}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
                <CategoryForm
                    isModalOpen={isEditModalOpen}
                    category={selectedCategory}
                    onModalClose={closeEditModal}
                />
                <DeleteModalLayout
                    dataName={selectedCategory?.name}
                    dataId={selectedCategory?.id}
                    dataType="Category"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedCategory}
                    getDeleteUrl={(id) => destroyCategory(id).url}
                />
            </AppLayout>
        </>
    );
}
