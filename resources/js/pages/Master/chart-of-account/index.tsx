import ChartOfAccountForm from '@/components/master/chart-of-accounts/chart-of-account-form';
import ChartOfAccountTable from '@/components/master/chart-of-accounts/chart-of-account-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyChartOfAccount, index } from '@/routes/chart-of-accounts';
import { BreadcrumbItem, IChartOfAccount, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    chartOfAccounts: PaginatedData<IChartOfAccount>;
    allAccounts?: IChartOfAccount[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'Chart of Account',
        href: index().url,
    },
];

const ChartOfAccountIndex = (props: PageProps) => {
    const { chartOfAccounts, allAccounts = [] } = props;

    const [selectedChartOfAccount, setSelectedChartOfAccount] = useState<
        IChartOfAccount | undefined
    >(undefined);

    const handleEdit = (chartOfAccount: IChartOfAccount) => {
        setSelectedChartOfAccount(chartOfAccount);
        openEditModal();
    };

    const handleDelete = (chartOfAccount: IChartOfAccount) => {
        setSelectedChartOfAccount(chartOfAccount);
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
                <Head title="Chart of Account" />
                <div className="flex justify-between">
                    <PageTitle title="Chart of Account" />
                    <Button
                        onClick={() => {
                            setSelectedChartOfAccount(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah Chart of Account
                    </Button>
                </div>
                <ChartOfAccountTable
                    chartOfAccounts={chartOfAccounts.data}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    pageFrom={chartOfAccounts.from}
                />
                {chartOfAccounts.data.length !== 0 && (
                    <TablePagination data={chartOfAccounts} />
                )}
                <ChartOfAccountForm
                    isModalOpen={isEditModalOpen}
                    chartOfAccount={selectedChartOfAccount}
                    onModalClose={closeEditModal}
                    parentAccounts={allAccounts}
                />
                <DeleteModalLayout
                    dataName={selectedChartOfAccount?.name}
                    dataId={selectedChartOfAccount?.id}
                    dataType="Chart of Account"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedChartOfAccount}
                    getDeleteUrl={(id) => destroyChartOfAccount(id).url}
                />
            </AppLayout>
        </>
    );
};

export default ChartOfAccountIndex;

