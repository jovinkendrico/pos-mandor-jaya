import StockMovementForm from '@/components/master/items/stock-movement/stock-movement-form';
import StockMovementTable from '@/components/master/items/stock-movement/stock-movement-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { index, show } from '@/routes/items';
import { BreadcrumbItem, IItem, IItemStockMovement } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    stockMovements: IItemStockMovement[];
    item: IItem;
}

const ShowStock = (props: PageProps) => {
    const { stockMovements, item } = props;

    const [selectedStockMovement, setSelectedStockMovement] = useState<
        IItemStockMovement | undefined
    >(undefined);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Master',
            href: '#',
        },
        {
            title: 'Barang',
            href: index().url,
        },
        {
            title: item.name,
            href: show(item.id).url,
        },
    ];

    const {
        isOpen: isEditModalOpen,
        openModal: openEditModal,
        closeModal: closeEditModal,
    } = useDisclosure();

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Barang" />
                <div className="flex flex-col gap-4">
                    <PageTitle title="Barang" />
                    <div className="flex justify-between">
                        <Button className="btn-danger">
                            <Link href={`/items`}>Kembali</Link>
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedStockMovement(undefined);
                                openEditModal();
                            }}
                            className="btn-primary"
                        >
                            <Plus />
                            Tambah Perpindahan Stok
                        </Button>
                    </div>
                </div>
                <StockMovementTable
                    onEdit={setSelectedStockMovement}
                    onDelete={setSelectedStockMovement}
                    pageFrom={1}
                    stock_movements={stockMovements}
                />
                <StockMovementForm
                    item_id={item.id}
                    isModalOpen={isEditModalOpen}
                    onModalclose={closeEditModal}
                    stock_movement={selectedStockMovement}
                />
                <DeleteModalLayout
                    dataId={selectedStockMovement?.id}
                    dataName={`StockMovement ${selectedStockMovement?.id}`}
                    dataType={`StockMovement`}
                    isModalOpen={!!selectedStockMovement}
                    onModalClose={closeEditModal}
                    setSelected={setSelectedStockMovement}
                    getDeleteUrl={(id: number) => destroyStockMovement(id).url}
                />
            </AppLayout>
        </>
    );
};

export default ShowStock;
