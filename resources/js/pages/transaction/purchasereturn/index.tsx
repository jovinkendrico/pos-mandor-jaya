import PageTitle from '@/components/page-title';
import PurchaseReturnTable from '@/components/transaction/purchasereturns/purchasereturn-table';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import {
    create,
    destroy as destroyPurchaseReturn,
    index,
} from '@/routes/purchase-returns';
import { BreadcrumbItem, IPurchaseReturn, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    purchase_returns: PaginatedData<IPurchaseReturn>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Retur Beli',
        href: index().url,
    },
];

const PurchaseReturnIndex = (props: PageProps) => {
    const { purchase_returns } = props;

    const [selectedPurchaseReturn, setSelectedPurchaseReturn] = useState<
        IPurchaseReturn | undefined
    >(undefined);

    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleDelete = (purchase_return: IPurchaseReturn) => {
        setSelectedPurchaseReturn(purchase_return);
        openDeleteModal();
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Retur Beli" />
                <div className="flex justify-between">
                    <PageTitle title="Retur Pembelian" />
                    <Button onClick={handleCreate} className="btn-primary">
                        <Plus />
                        Tambah Retur Beli
                    </Button>
                </div>
                <PurchaseReturnTable
                    purchase_returns={purchase_returns.data}
                    onDelete={handleDelete}
                />
                <DeleteModalLayout
                    dataName={selectedPurchaseReturn?.return_number}
                    dataId={selectedPurchaseReturn?.id}
                    dataType="Retur Pembelian"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedPurchaseReturn}
                    getDeleteUrl={(id) => destroyPurchaseReturn(id).url}
                />
            </AppLayout>
        </>
    );
};

export default PurchaseReturnIndex;
