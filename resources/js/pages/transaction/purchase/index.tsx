import PageTitle from '@/components/page-title';
import PurchaseTable from '@/components/transaction/purchases/purchase-table';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { create, destroy as destroyPurchase, index } from '@/routes/purchases';
import {
    BreadcrumbItem,
    PageProps as InertiaPageProps,
    IPurchase,
    PaginatedData,
} from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface PageProps {
    purchases: PaginatedData<IPurchase>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Pembelian',
        href: index().url,
    },
];

const PurchaseIndex = (props: PageProps) => {
    const { purchases } = props;
    const { flash } = usePage<InertiaPageProps>().props;

    const [selectedPurchase, setSelectedPurchase] = useState<
        IPurchase | undefined
    >(undefined);

    useMemo(() => {
        if (
            flash.success === 'Pembelian berhasil ditambahkan' ||
            flash.success === 'Pembelian berhasil diperbarui'
        ) {
            toast.success(flash.success);
        }
    }, [flash]);

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleDelete = (purchase: IPurchase) => {
        setSelectedPurchase(purchase);
        openDeleteModal();
    };

    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Pembelian" />
                <div className="flex justify-between">
                    <PageTitle title="Pembelian" />
                    <Button onClick={handleCreate} className="btn-primary">
                        <Plus />
                        Tambah Pembelian
                    </Button>
                </div>
                <PurchaseTable
                    purchases={purchases.data}
                    pageFrom={purchases.from}
                    onDelete={handleDelete}
                />
                {purchases.data.length !== 0 && (
                    <TablePagination data={purchases} />
                )}
                <DeleteModalLayout
                    dataName={selectedPurchase?.purchase_number}
                    dataId={selectedPurchase?.id}
                    dataType="Pembelian"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedPurchase}
                    getDeleteUrl={(id: number) => destroyPurchase(id).url}
                    dontPrintMessage
                />
            </AppLayout>
        </>
    );
};

export default PurchaseIndex;
