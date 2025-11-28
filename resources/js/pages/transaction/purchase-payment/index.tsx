import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import PurchasePaymentTable from '@/components/transaction/purchase-payments/purchase-payment-table';
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
    destroy as destroyPurchasePayment,
    index,
} from '@/routes/purchase-payments';
import {
    BreadcrumbItem,
    IBank,
    PageProps as InertiaPageProps,
    IPurchasePayment,
    ISupplier,
    PaginatedData,
} from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface PageProps {
    purchase_payments: PaginatedData<IPurchasePayment>;
    banks?: IBank[];
    suppliers?: ISupplier[];
    filters?: {
        search: string;
        date_from: string;
        date_to: string;
        status: string;
        bank_id: string;
        payment_method: string;
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
        title: 'Pembayaran Pembelian',
        href: '/purchase-payments',
    },
];

const PurchasePaymentIndex = (props: PageProps) => {
    const {
        purchase_payments,
        banks = [],
        suppliers = [],
        filters = {
            search: '',
            date_from: '',
            date_to: '',
            status: 'all',
            bank_id: '',
            payment_method: 'all',
            supplier_id: '',
            sort_by: 'payment_date',
            sort_order: 'desc',
        },
    } = props;
    const { flash } = usePage<InertiaPageProps>().props;

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const [selectedPurchasePayment, setSelectedPurchasePayment] = useState<
        IPurchasePayment | undefined
    >(undefined);

    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    useEffect(() => {
        if (
            flash?.success === 'Pembayaran pembelian berhasil ditambahkan.' ||
            flash?.success === 'Pembayaran pembelian berhasil diperbarui.'
        ) {
            toast.success(flash.success);
            flash.success = null;
        }
    }, [flash]);

    const handleCreate = () => {
        router.visit('/purchase-payments/create');
    };

    const handleDelete = (purchase_payment: IPurchasePayment) => {
        setSelectedPurchasePayment(purchase_payment);
        openDeleteModal();
    };

    const bankComboboxOptions: ComboboxOption[] = useMemo(() => {
        const options: ComboboxOption[] = [{ value: '', label: 'Semua Bank' }];

        banks.forEach((bank) => {
            options.push({
                label: bank.name,
                value: bank.id.toString(),
            });
        });

        return options;
    }, [banks]);

    const supplierCombobox: ComboboxOption[] = useMemo(() => {
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
            <Head title="Pembayaran Pembelian" />
            <div className="flex justify-between">
                <PageTitle title="Pembayaran Pembelian" />
                <Button onClick={handleCreate} className="btn-primary">
                    <Plus />
                    Tambah Pembayaran
                </Button>
            </div>
            <FilterBar
                filters={{ ...allFilters, search: searchTerm }}
                onFilterChange={handleFilterChange}
                showPaymentStatus={false}
                sortOptions={[
                    { value: 'payment_date', label: 'Tanggal' },
                    { value: 'payment_number', label: 'No. Pembayaran' },
                    { value: 'total_amount', label: 'Jumlah' },
                    { value: 'status', label: 'Status' },
                ]}
                statusOptions={[
                    { value: 'all', label: 'Semua Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                ]}
                additionalFilters={
                    <>
                        <div className="w-[180px]">
                            <Label htmlFor="bank_id">Bank/Kas</Label>
                            <Combobox
                                options={bankComboboxOptions}
                                value={allFilters.bank_id || ''}
                                onValueChange={(value) =>
                                    handleFilterChange({
                                        bank_id: value || '',
                                    })
                                }
                                placeholder="Semua Supplier"
                                searchPlaceholder="Cari supplier..."
                                className="combobox"
                                maxDisplayItems={10}
                            />
                        </div>
                        <div className="w-[180px]">
                            <Label htmlFor="payment_method">
                                Metode Pembayaran
                            </Label>
                            <Select
                                value={allFilters.payment_method || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange({
                                        payment_method: value,
                                    })
                                }
                            >
                                <SelectTrigger
                                    id="payment_method"
                                    className="combobox"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="cash">Tunai</SelectItem>
                                    <SelectItem value="transfer">
                                        Transfer
                                    </SelectItem>
                                    <SelectItem value="giro">Giro</SelectItem>
                                    <SelectItem value="cek">Cek</SelectItem>
                                    <SelectItem value="other">
                                        Lainnya
                                    </SelectItem>
                                    <SelectItem value="refund">
                                        Refund
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[180px]">
                            <Label htmlFor="supplier_id">Supplier</Label>
                            <Combobox
                                options={supplierCombobox}
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
                <PurchasePaymentTable
                    purchase_payments={purchase_payments.data}
                    pageFrom={purchase_payments.from}
                    onDelete={handleDelete}
                />
            </div>
            {purchase_payments.data.length !== 0 && (
                <TablePagination data={purchase_payments} />
            )}
            <DeleteModalLayout
                dataName={selectedPurchasePayment?.payment_number}
                dataId={selectedPurchasePayment?.id}
                dataType="Pembayaran Pembelian"
                isModalOpen={isDeleteModalOpen}
                onModalClose={closeDeleteModal}
                setSelected={setSelectedPurchasePayment}
                getDeleteUrl={(id) => destroyPurchasePayment(id).url}
            />
        </AppLayout>
    );
};

export default PurchasePaymentIndex;
