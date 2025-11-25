import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import PurchaseReturnTable from '@/components/transaction/purchasereturns/purchasereturn-table';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
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
    create,
    destroy as destroyPurchaseReturn,
    index,
} from '@/routes/purchase-returns';
import {
    BreadcrumbItem,
    PageProps as InertiaPageProps,
    IPurchaseReturn,
    PaginatedData,
    Supplier,
} from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface PageProps {
    returns: PaginatedData<IPurchaseReturn>;
    suppliers?: Supplier[];
    filters?: {
        search: string;
        date_from: string;
        date_to: string;
        status: string;
        return_type: string;
        supplier_id: string;
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
        title: 'Retur Beli',
        href: index().url,
    },
];

const PurchaseReturnIndex = (props: PageProps) => {
    const {
        returns,
        suppliers = [],
        filters = {
            search: '',
            date_from: '',
            date_to: '',
            status: 'all',
            return_type: 'all',
            supplier_id: '',
            sort_by: 'return_date',
            sort_order: 'desc',
        },
    } = props;

    const { flash } = usePage<InertiaPageProps>().props;

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const [selectedPurchaseReturn, setSelectedPurchaseReturn] = useState<
        IPurchaseReturn | undefined
    >(undefined);

    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    useEffect(() => {
        if (flash?.success === 'Retur pembelian berhasil ditambahkan.') {
            toast.success(flash?.success);
            flash.success = null;
        }
    }, [flash]);

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleDelete = (purchase_return: IPurchaseReturn) => {
        setSelectedPurchaseReturn(purchase_return);
        openDeleteModal();
    };

    const supplierComboboxOptions: ComboboxOption[] = useMemo(() => {
        const options: ComboboxOption[] = [
            { value: '', label: 'Semua Supplier' },
        ];

        suppliers.forEach((supplier) => {
            options.push({
                label: supplier.name,
                value: supplier.id.toString(),
            });
        });

        return options;
    }, [suppliers]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Retur Beli" />
            <div className="flex justify-between">
                <PageTitle title="Retur Pembelian" />
                <Button onClick={handleCreate} className="btn-primary">
                    <Plus />
                    Tambah Retur Beli
                </Button>
            </div>
            <FilterBar
                filters={{ ...allFilters, search: searchTerm }}
                onFilterChange={handleFilterChange}
                showPaymentStatus={false}
                sortOptions={[
                    { value: 'return_date', label: 'Tanggal' },
                    { value: 'return_number', label: 'No. Retur' },
                    { value: 'total_amount', label: 'Total' },
                    { value: 'status', label: 'Status' },
                ]}
                additionalFilters={
                    <>
                        <div className="w-[180px]">
                            <Label htmlFor="return_type">Tipe Retur</Label>
                            <Select
                                value={allFilters.return_type || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange({ return_type: value })
                                }
                            >
                                <SelectTrigger
                                    id="return_type"
                                    className="combobox"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="stock_only">
                                        Retur Stok Saja
                                    </SelectItem>
                                    <SelectItem value="stock_and_refund">
                                        Retur Stok + Refund
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[180px]">
                            <Label htmlFor="supplier_id">Supplier</Label>
                            <Combobox
                                options={supplierComboboxOptions}
                                value={allFilters.supplier_id || ''}
                                onValueChange={(value) =>
                                    handleFilterChange({
                                        supplier_id: value || '',
                                    })
                                }
                                placeholder="Semua Supplier"
                                searchPlaceholder="Cari supplier..."
                                className="combobox"
                                maxDisplayItems={10}
                            />
                        </div>
                    </>
                }
            />
            <div className="mt-4">
                <PurchaseReturnTable
                    purchase_returns={returns.data}
                    pageFrom={returns.from}
                    onDelete={handleDelete}
                />
            </div>
            {returns.data.length !== 0 && <TablePagination data={returns} />}

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
    );
};

export default PurchaseReturnIndex;
