import ChartOfAccountForm from '@/components/master/chart-of-accounts/chart-of-account-form';
import ChartOfAccountTable from '@/components/master/chart-of-accounts/chart-of-account-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Card } from '@/components/ui/card';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyChartOfAccount, index } from '@/routes/chart-of-accounts';
import { BreadcrumbItem, IChartOfAccount, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { ArrowUpDown, Search, Plus, X } from 'lucide-react';
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
        title: 'Chart of Account',
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

    const handleSortOrderToggle = () => {
        const newOrder = allFilters.sort_order === 'asc' ? 'desc' : 'asc';
        handleFilterChange({ sort_order: newOrder });
    };

    const handleReset = () => {
        handleFilterChange({
            search: '',
            type: 'all',
            is_active: 'all',
            parent_id: 'all',
            sort_by: 'code',
            sort_order: 'asc',
        });
    };

    const hasActiveFilters =
        allFilters.search !== '' ||
        allFilters.type !== 'all' ||
        allFilters.is_active !== 'all' ||
        allFilters.parent_id !== 'all' ||
        allFilters.sort_by !== 'code' ||
        allFilters.sort_order !== 'asc';

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
                <Card className="content space-y-4 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="min-w-[200px] flex-1">
                            <Label htmlFor="search">Cari</Label>
                            <InputGroup className="input-box">
                                <InputGroupInput
                                    placeholder="Cari kode, nama..."
                                    className=""
                                    id="search"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        handleFilterChange({ search: e.target.value })
                                    }
                                />
                                <InputGroupAddon>
                                    <Search />
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
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
                                    <SelectItem value="asset">Asset</SelectItem>
                                    <SelectItem value="liability">Liability</SelectItem>
                                    <SelectItem value="equity">Equity</SelectItem>
                                    <SelectItem value="income">Income</SelectItem>
                                    <SelectItem value="expense">Expense</SelectItem>
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
                        <div className="w-[180px]">
                            <Label htmlFor="sort_by">Urutkan</Label>
                            <div className="flex gap-2">
                                <Select
                                    value={allFilters.sort_by}
                                    onValueChange={(value) =>
                                        handleFilterChange({ sort_by: value })
                                    }
                                >
                                    <SelectTrigger id="sort_by" className="combobox">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="code">Kode</SelectItem>
                                        <SelectItem value="name">Nama</SelectItem>
                                        <SelectItem value="type">Tipe</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleSortOrderToggle}
                                    title={
                                        allFilters.sort_order === 'asc'
                                            ? 'Urutkan Naik'
                                            : 'Urutkan Turun'
                                    }
                                    className="btn-secondary"
                                >
                                    <ArrowUpDown className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="btn-danger"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                        )}
                    </div>
                </Card>
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

