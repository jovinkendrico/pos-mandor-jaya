import BankForm from '@/components/master/banks/bank-form';
import BankTable from '@/components/master/banks/bank-table';
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
import { destroy as destroyBank, index } from '@/routes/banks';
import { BreadcrumbItem, IBank, IChartOfAccount, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    banks: PaginatedData<IBank>;
    chartOfAccounts?: IChartOfAccount[];
    filters?: {
        search: string;
        type: string;
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
        title: 'Bank/Cash',
        href: index().url,
    },
];

const BankIndex = (props: PageProps) => {
    const {
        banks,
        chartOfAccounts = [],
        filters = {
            search: '',
            type: 'all',
            sort_by: 'name',
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
                <FilterBar
                    filters={{ ...allFilters, search: searchTerm }}
                    onFilterChange={handleFilterChange}
                    defaultSortOrder="asc"
                    showPaymentStatus={false}
                    showDateRange={false}
                    showStatus={false}
                    sortOptions={[
                        { value: 'name', label: 'Nama' },
                        { value: 'balance', label: 'Saldo' },
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
                                <SelectItem value="cash">Kas</SelectItem>
                                <SelectItem value="bank">Bank</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </FilterBar>
                <div className="mt-4">
                    <BankTable
                        banks={banks.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        pageFrom={banks.from}
                    />
                </div>
                {banks.data.length !== 0 && <TablePagination data={banks} />}
                <BankForm
                    isModalOpen={isEditModalOpen}
                    bank={selectedBank}
                    onModalClose={closeEditModal}
                    chartsOfAccounts={chartOfAccounts}
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
};

export default BankIndex;
