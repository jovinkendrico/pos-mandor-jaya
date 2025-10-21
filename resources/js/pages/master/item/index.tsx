import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import ItemDeleteConfirmation from '@/components/master/items/item-delete-confirmation';
import ItemForm from '@/components/master/items/item-form';
import ItemTable from '@/components/master/items/item-table';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/items';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface ItemUom {
    id: number;
    uom_name: string;
    conversion_value: number;
    price: string;
    is_base: boolean;
}

interface Item {
    id: number;
    code: string;
    name: string;
    base_uom: string;
    stock: string;
    description?: string;
    uoms?: ItemUom[];
}

interface PageProps {
    items: {
        data: Item[];
    };
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

export default function ItemIndex({ items }: PageProps) {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleEdit = (item: Item) => {
        setSelectedItem(item);
        setIsFormModalOpen(true);
    };

    const handleDelete = (item: Item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleFormClose = () => {
        setIsFormModalOpen(false);
        setSelectedItem(null);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Barang" />
                <div className="flex justify-between">
                    <PageTitle title="Barang" />
                    <Button onClick={() => setIsFormModalOpen(true)}>
                        <Plus />
                        Tambah Barang
                    </Button>
                </div>
                <ItemTable items={items.data} onEdit={handleEdit} onDelete={handleDelete} />
                <ItemForm
                    isModalOpen={isFormModalOpen}
                    onOpenChange={handleFormClose}
                    item={selectedItem}
                />
                <ItemDeleteConfirmation
                    isModalOpen={isDeleteModalOpen}
                    onOpenChange={setIsDeleteModalOpen}
                    item={selectedItem}
                />
            </AppLayout>
        </>
    );
}

