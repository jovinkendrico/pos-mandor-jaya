import CashFlowForm from '@/components/accounting/cash-flows/cash-flow-form';
import CashFlowTable from '@/components/accounting/cash-flows/cash-flow-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyCashFlow, index } from '@/routes/cash-flows';
import { BreadcrumbItem, ICashFlow } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    cashFlows: {
        data: ICashFlow[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounting',
        href: '#',
    },
    {
        title: 'Cash Flows',
        href: index().url,
    },
];

export default function CashFlowIndex({ cashFlows }: PageProps) {
    const [selectedCashFlow, setSelectedCashFlow] = useState<ICashFlow | undefined>(
        undefined,
    );

    const handleEdit = (cashFlow: ICashFlow) => {
        setSelectedCashFlow(cashFlow);
        openEditModal();
    };

    const handleDelete = (cashFlow: ICashFlow) => {
        setSelectedCashFlow(cashFlow);
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
                <Head title="Cash Flows" />
                <div className="flex justify-between">
                    <PageTitle title="Cash Flows" />
                    <Button
                        onClick={() => {
                            setSelectedCashFlow(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah Cash Flow
                    </Button>
                </div>
                <CashFlowTable
                    cashFlows={cashFlows.data}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
                <CashFlowForm
                    isModalOpen={isEditModalOpen}
                    cashFlow={selectedCashFlow}
                    onModalClose={closeEditModal}
                />
                <DeleteModalLayout
                    dataName={selectedCashFlow?.description}
                    dataId={selectedCashFlow?.id}
                    dataType="Cash Flow"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedCashFlow}
                    getDeleteUrl={(id) => destroyCashFlow(id).url}
                />
            </AppLayout>
        </>
    );
}
