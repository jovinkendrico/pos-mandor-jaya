import BankForm from '@/components/master/banks/bank-form';
import BankTable from '@/components/master/banks/bank-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyBank, index } from '@/routes/banks';
import { BreadcrumbItem, IBank, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    banks: PaginatedData<IBank>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'Bank/Cash',
        href: index().url,
    },
];

export default function BankIndex({ banks }: PageProps) {
    const [selectedBank, setSelectedBank] = useState<IBank | undefined>(
        undefined,
    );

    const handleEdit = (bank: IBank) => {
        setSelectedBank(bank);
        openEditModal();
    };

    const handleDelete = (bank: IBank) => {
        setSelectedBank(bank);
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
                <Head title="Bank/Cash" />
                <div className="flex justify-between">
                    <PageTitle title="Bank/Cash" />
                    <Button
                        onClick={() => {
                            setSelectedBank(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah Bank/Cash
                    </Button>
                </div>
                <BankTable
                    banks={banks.data}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    pageFrom={banks.from}
                />
                {banks.data.length !== 0 && <TablePagination data={banks} />}
                <BankForm
                    isModalOpen={isEditModalOpen}
                    bank={selectedBank}
                    onModalClose={closeEditModal}
                />
                <DeleteModalLayout
                    dataName={selectedBank?.name}
                    dataId={selectedBank?.id}
                    dataType="Bank/Cash"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedBank}
                    getDeleteUrl={(id) => destroyBank(id).url}
                />
            </AppLayout>
        </>
    );
}
