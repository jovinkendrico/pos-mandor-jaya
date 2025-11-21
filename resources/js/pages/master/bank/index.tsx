import BankForm from '@/components/master/banks/bank-form';
import BankTable from '@/components/master/banks/bank-table';
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
import { destroy as destroyBank, index } from '@/routes/banks';
import { BreadcrumbItem, IBank, IChartOfAccount, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { ArrowUpDown, Search, Plus, X } from 'lucide-react';
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

    const handleSortOrderToggle = () => {
        const newOrder = allFilters.sort_order === 'asc' ? 'desc' : 'asc';
        handleFilterChange({ sort_order: newOrder });
    };

    const handleReset = () => {
        handleFilterChange({
            search: '',
            type: 'all',
            sort_by: 'name',
            sort_order: 'asc',
        });
    };

    const hasActiveFilters =
        allFilters.search !== '' ||
        allFilters.type !== 'all' ||
        allFilters.sort_by !== 'name' ||
        allFilters.sort_order !== 'asc';

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
                <Card className="content space-y-4 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="min-w-[200px] flex-1">
                            <Label htmlFor="search">Cari</Label>
                            <InputGroup className="input-box">
                                <InputGroupInput
                                    placeholder="Cari nama, nomor rekening..."
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
                                    <SelectItem value="cash">Kas</SelectItem>
                                    <SelectItem value="bank">Bank</SelectItem>
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
                                        <SelectItem value="name">Nama</SelectItem>
                                        <SelectItem value="balance">Saldo</SelectItem>
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
