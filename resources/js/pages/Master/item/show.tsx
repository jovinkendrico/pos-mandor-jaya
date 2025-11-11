import StockMovementTable from '@/components/master/items/stock-movement/stock-movement-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import AppLayout from '@/layouts/app-layout';
import { index, show } from '@/routes/items';
import {
    BreadcrumbItem,
    IItem,
    IItemStockMovement,
    PaginatedData,
} from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronsLeft } from 'lucide-react';

interface PageProps {
    stockMovements: PaginatedData<IItemStockMovement>;
    item: IItem;
}

const ShowStock = (props: PageProps) => {
    const { stockMovements, item } = props;

    // const [selectedStockMovement, setSelectedStockMovement] = useState<
    //     IItemStockMovement | undefined
    // >(undefined);

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

    // const {
    //     isOpen: isEditModalOpen,
    //     openModal: openEditModal,
    //     closeModal: closeEditModal,
    // } = useDisclosure();

    // const {
    //     isOpen: isDeleteModalOpen,
    //     openModal: openDeleteModal,
    //     closeModal: closeDeleteModal,
    // } = useDisclosure();

    // const handleEdit = (stockMovement: IItemStockMovement) => {
    //     setSelectedStockMovement(stockMovement);
    //     openEditModal();
    // };

    // const handleDelete = (stockMovement: IItemStockMovement) => {
    //     setSelectedStockMovement(stockMovement);
    //     openDeleteModal();
    // };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Barang" />
                <div className="flex flex-col gap-4">
                    <PageTitle title={`Perpindahan Stok (${item.name})`} />
                    <div className="flex justify-between">
                        <Button className="btn-danger">
                            <Link
                                href={`/items`}
                                className="flex items-center justify-between gap-2"
                            >
                                <ChevronsLeft /> Kembali
                            </Link>
                        </Button>
                        {/* <Button
                            onClick={() => {
                                setSelectedStockMovement(undefined);
                                openEditModal();
                            }}
                            className="btn-primary"
                        >
                            <Plus />
                            Tambah Perpindahan Stok
                        </Button> */}
                    </div>
                </div>
                <StockMovementTable
                    // onEdit={handleEdit}
                    // onDelete={handleDelete}
                    pageFrom={1}
                    stock_movements={stockMovements.data}
                    item_name={item.name}
                />
                {/* <StockMovementForm
                    item_id={item.id}
                    isModalOpen={isEditModalOpen}
                    onModalclose={closeEditModal}
                    stock_movement={selectedStockMovement}
                /> */}
                {stockMovements.data.length !== 0 && (
                    <TablePagination data={stockMovements} />
                )}
                {/* <DeleteModalLayout
                    dataId={selectedStockMovement?.id}
                    dataName={`StockMovement ${selectedStockMovement?.id}`}
                    dataType={`StockMovement`}
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedStockMovement}
                    getDeleteUrl={(id: number) => destroyStockMovement(id).url}
                /> */}
            </AppLayout>
        </>
    );
};

export default ShowStock;
