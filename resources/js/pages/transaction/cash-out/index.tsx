import { usePermission } from '@/hooks/use-permission';
import PageTitle from '@/components/page-title';
import CashOutTable from '@/components/transaction/cash-outs/cash-out-table';
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
import { create, destroy as destroyCashOut, index } from '@/routes/cash-outs';
import {
    BreadcrumbItem,
    IBank,
    ICashOut,
    PageProps as InertiaPageProps,
    PaginatedData,
} from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PageProps {
    cashOuts: PaginatedData<ICashOut>;
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
        title: 'Kas Keluar',
        href: '/cash-outs',
    },
];

const CashOutIndex = (props: PageProps) => {
    const {
        cashOuts,
        banks = [],
        filters = {
            search: '',
            date_from: '',
            date_to: '',
            status: 'all',
            bank_id: '',
            reference_type: 'all',
            sort_by: 'cash_out_date',
            sort_order: 'desc',
        },
    } = props;
    const { flash } = usePage<InertiaPageProps>().props;
    const { hasPermission } = usePermission();

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const [selectedCashOut, setSelectedCashOut] = useState<
        ICashOut | undefined
    >(undefined);

    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    useEffect(() => {
        if (
            flash?.success === 'Kas keluar berhasil ditambahkan.' ||
            flash?.success === 'Kas keluar berhasil diperbarui.'
        ) {
            toast.success(flash.success);
            flash.success = null;
        }
    }, [flash]);

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleDelete = (cashOut: ICashOut) => {
        setSelectedCashOut(cashOut);
        openDeleteModal();
    };

    const bankOptions = banks.map((bank) => ({
        value: bank.id.toString(),
        label: bank.name,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kas Keluar" />
            <div className="flex justify-between">
                <PageTitle title="Kas Keluar" />
                {hasPermission('cash-outs.create') && (
                    <Button onClick={handleCreate} className="btn-primary">
                        <Plus />
                        Tambah Kas Keluar
                    </Button>
                )}
            </div>
            <FilterBar
                filters={{ ...allFilters, search: searchTerm }}
                onFilterChange={handleFilterChange}
                showPaymentStatus={false}
                sortOptions={[
                    { value: 'cash_out_date', label: 'Tanggal' },
                    { value: 'cash_out_number', label: 'No. Kas Keluar' },
                    { value: 'amount', label: 'Jumlah' },
                    { value: 'status', label: 'Status' },
                ]}
                statusOptions={[
                    { value: 'all', label: 'Semua Status' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'posted', label: 'Posted' },
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
                                    <SelectItem value="PurchasePayment">
                                        Pembayaran Pembelian
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                }
            />
            <div className="mt-4">
                <CashOutTable
                    cashOuts={cashOuts.data}
                    pageFrom={cashOuts.from}
                    onDelete={handleDelete}
                />
            </div>
            {cashOuts.data.length !== 0 && (
                <TablePagination data={cashOuts} />
            )}
            <DeleteModalLayout
                dataName={selectedCashOut?.cash_out_number}
                dataId={selectedCashOut?.id}
                dataType="Kas Keluar"
                isModalOpen={isDeleteModalOpen}
                onModalClose={closeDeleteModal}
                setSelected={setSelectedCashOut}
                getDeleteUrl={(id) => destroyCashOut(id).url}
            />
        </AppLayout>
    );
};

export default CashOutIndex;

