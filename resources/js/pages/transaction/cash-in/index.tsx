import { usePermission } from '@/hooks/use-permission';
import PageTitle from '@/components/page-title';
import CashInTable from '@/components/transaction/cash-ins/cash-in-table';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
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
import { create, destroy as destroyCashIn, index } from '@/routes/cash-ins';
import {
    IBank,
    BreadcrumbItem,
    ICashIn,
    PageProps as InertiaPageProps,
    PaginatedData,
} from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PageProps {
    cashIns: PaginatedData<ICashIn>;
    banks?: IBank[];
    filters?: {
        search: string;
        date_from: string;
        date_to: string;
        status: string;
        bank_id: string;
        reference_type: string;
        sort_by: string;
        sort_order: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Kas Masuk',
        href: '/cash-ins',
    },
];

const CashInIndex = (props: PageProps) => {
    const {
        cashIns,
        banks = [],
        filters = {
            search: '',
            date_from: '',
            date_to: '',
            status: 'all',
            bank_id: '',
            reference_type: 'all',
            sort_by: 'cash_in_date',
            sort_order: 'desc',
        },
    } = props;
    const { flash } = usePage<InertiaPageProps>().props;
    const { hasPermission } = usePermission();

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const [selectedCashIn, setSelectedCashIn] = useState<ICashIn | undefined>(
        undefined,
    );

    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    useEffect(() => {
        if (
            flash?.success === 'Kas Masuk berhasil ditambahkan.' ||
            flash?.success === 'Kas Masuk berhasil diperbarui.'
        ) {
            toast.success(flash.success);
            flash.success = null;
        }
    }, [flash]);

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleDelete = (cashIn: ICashIn) => {
        setSelectedCashIn(cashIn);
        openDeleteModal();
    };

    const bankOptions = banks.map((bank) => ({
        value: bank.id.toString(),
        label: bank.name,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kas Masuk" />
            <div className="flex justify-between">
                <PageTitle title="Kas Masuk" />
                {hasPermission('cash-ins.create') && (
                    <Button onClick={handleCreate} className="btn-primary">
                        <Plus />
                        Tambah Kas Masuk
                    </Button>
                )}
            </div>
            <FilterBar
                filters={{ ...allFilters, search: searchTerm }}
                onFilterChange={handleFilterChange}
                showPaymentStatus={false}
                sortOptions={[
                    { value: 'cash_in_date', label: 'Tanggal' },
                    { value: 'cash_in_number', label: 'No. Kas Masuk' },
                    { value: 'amount', label: 'Jumlah' },
                    { value: 'status', label: 'Status' },
                ]}
                statusOptions={[
                    { value: 'all', label: 'Semua Status' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'posted', label: 'Posted' },
                    { value: 'cancelled', label: 'Dibatalkan' },
                ]}
                additionalFilters={
                    <>
                        <div className="w-[180px]">
                            <Label htmlFor="bank_id">Bank/Kas</Label>
                            <Combobox
                                options={bankOptions}
                                value={allFilters.bank_id || ''}
                                onValueChange={(value) =>
                                    handleFilterChange({ bank_id: value })
                                }
                                placeholder="Semua Bank"
                                searchPlaceholder="Cari Bank..."
                                className="combobox"
                            />
                        </div>
                        <div className="w-[180px]">
                            <Label htmlFor="reference_type">
                                Tipe Referensi
                            </Label>
                            <Select
                                value={allFilters.reference_type || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange({
                                        reference_type: value,
                                    })
                                }
                            >
                                <SelectTrigger
                                    id="reference_type"
                                    className="combobox"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="manual">
                                        Manual
                                    </SelectItem>
                                    <SelectItem value="SalePayment">
                                        Pembayaran Penjualan
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                }
            />
            <div className="mt-4">
                <CashInTable
                    cashIns={cashIns.data}
                    pageFrom={cashIns.from}
                    onDelete={handleDelete}
                />
            </div>
            {cashIns.data.length !== 0 && <TablePagination data={cashIns} />}
            <DeleteModalLayout
                dataName={selectedCashIn?.cash_in_number}
                dataId={selectedCashIn?.id}
                dataType="Kas Masuk"
                isModalOpen={isDeleteModalOpen}
                onModalClose={closeDeleteModal}
                setSelected={setSelectedCashIn}
                getDeleteUrl={(id) => destroyCashIn(id).url}
            />
        </AppLayout>
    );
};

export default CashInIndex;
