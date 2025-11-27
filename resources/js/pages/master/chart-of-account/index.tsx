import ChartOfAccountForm from '@/components/master/chart-of-accounts/chart-of-account-form';
import ChartOfAccountTable from '@/components/master/chart-of-accounts/chart-of-account-table';
import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import {
    destroy as destroyChartOfAccount,
    index,
} from '@/routes/chart-of-accounts';
import { BreadcrumbItem, IChartOfAccount, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    chartOfAccounts: PaginatedData<IChartOfAccount>;
    allAccounts?: IChartOfAccount[];
    filters?: {
        search: string;
        type: string;
        is_active: string;
        parent_id: string;
        sort_by: string;
        sort_order: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'Kode Perkiraan',
        href: index().url,
    },
];

const ChartOfAccountIndex = (props: PageProps) => {
    const {
        chartOfAccounts,
        allAccounts = [],
        filters = {
            search: '',
            type: 'all',
            is_active: 'all',
            parent_id: 'all',
            sort_by: 'code',
            sort_order: 'asc',
        },
    } = props;

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        {
            ...filters,
            status: 'all',
            date_from: '',
            date_to: '',
        },
    );

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
                <Head title="Kode Perkiraan" />
                <div className="flex justify-between">
                    <PageTitle title="Kode Perkiraan" />
                    <Button
                        onClick={() => {
                            setSelectedChartOfAccount(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah Kode Perkiraan
                    </Button>
                </div>
                <FilterBar
                    filters={{ ...allFilters, search: searchTerm }}
                    onFilterChange={handleFilterChange}
                    defaultSortOrder="asc"
                    showPaymentStatus={false}
                    showDateRange={false}
                    showStatus={false}
                    sortOptions={[
                        { value: 'code', label: 'Kode' },
                        { value: 'name', label: 'Nama' },
                        { value: 'type', label: 'Tipe' },
                    ]}
                >
                    <div className="w-[180px]">
                        <Label htmlFor="type">Tipe</Label>
                        <Select
                            value={allFilters.type || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange({ type: value })
                            }
                        >
                            <SelectTrigger id="type" className="combobox">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="asset">Aset</SelectItem>
                                <SelectItem value="liability">
                                    Kewajiban
                                </SelectItem>
                                <SelectItem value="equity">Ekuitas</SelectItem>
                                <SelectItem value="income">
                                    Pendapatan
                                </SelectItem>
                                <SelectItem value="expense">Biaya</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-[180px]">
                        <Label htmlFor="is_active">Status</Label>
                        <Select
                            value={allFilters.is_active || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange({ is_active: value })
                            }
                        >
                            <SelectTrigger id="is_active" className="combobox">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="1">Aktif</SelectItem>
                                <SelectItem value="0">Tidak Aktif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </FilterBar>
                <div className="mt-4">
                    <ChartOfAccountTable
                        chartOfAccounts={chartOfAccounts.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        pageFrom={chartOfAccounts.from}
                    />
                </div>
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
                    dataType="Kode Perkiraan"
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
