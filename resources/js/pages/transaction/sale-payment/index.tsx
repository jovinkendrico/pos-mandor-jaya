import { usePermission } from '@/hooks/use-permission';
import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import SalePaymentTable from '@/components/transaction/sale-payments/sale-payment-table';
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
import { destroy as destroySalePayment, index } from '@/routes/sale-payments';
import {
    BreadcrumbItem,
    IBank,
    ICustomer,
    PageProps as InertiaPageProps,
    ISalePayment,
    PaginatedData,
} from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface PageProps {
    sale_payments: PaginatedData<ISalePayment>;
    banks?: IBank[];
    customers?: ICustomer[];
    filters?: {
        search: string;
        date_from: string;
        date_to: string;
        status: string;
        bank_id: string;
        payment_method: string;
        customer_id: string;
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
        title: 'Pembayaran Penjualan',
        href: '/sale-payments',
    },
];

const SalePaymentIndex = (props: PageProps) => {
    const {
        sale_payments,
        banks = [],
        customers = [],
        filters = {
            search: '',
            date_from: '',
            date_to: '',
            status: 'all',
            bank_id: '',
            payment_method: 'all',
            customer_id: '',
            sort_by: 'payment_date',
            sort_order: 'desc',
        },
    } = props;

    const { flash } = usePage<InertiaPageProps>().props;
    const { hasPermission } = usePermission();

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const [selectedSalePayment, setSelectedSalePayment] = useState<
        ISalePayment | undefined
    >(undefined);

    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    useEffect(() => {
        if (
            flash?.success === 'Pembayaran penjualan berhasil ditambahkan.' ||
            flash?.success === 'Pembayaran penjualan berhasil diperbarui.'
        ) {
            toast.success(flash.success);
            flash.success = null;
        }
    }, [flash]);

    const handleCreate = () => {
        router.visit('/sale-payments/create');
    };

    const handleDelete = (payment: ISalePayment) => {
        setSelectedSalePayment(payment);
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

    const customerCombobox: ComboboxOption[] = useMemo(() => {
        const options: ComboboxOption[] = [
            { value: '', label: 'Semua Customer' },
        ];

        customers.forEach((customer) => {
            options.push({
                label: customer.name,
                value: customer.id.toString(),
            });
        });

        return options;
    }, [customers]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pembayaran Penjualan" />
            <div className="flex justify-between">
                <PageTitle title="Pembayaran Penjualan" />
                {hasPermission('sale-payments.create') && (
                    <Button onClick={handleCreate} className="btn-primary">
                        <Plus />
                        Tambah Pembayaran
                    </Button>
                )}
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
                                placeholder="Semua Bank"
                                searchPlaceholder="Cari bank..."
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
                            <Label htmlFor="customer_id">Customer</Label>
                            <Combobox
                                options={customerCombobox}
                                value={allFilters.customer_id || ''}
                                onValueChange={(value) =>
                                    handleFilterChange({
                                        customer_id: value || '',
                                    })
                                }
                                placeholder="Semua Customer"
                                searchPlaceholder="Cari customer..."
                                className="combobox"
                                maxDisplayItems={10}
                            />
                        </div>
                    </>
                }
            />
            <div className="mt-4">
                <SalePaymentTable
                    payments={sale_payments.data}
                    pageFrom={sale_payments.from}
                    onDelete={handleDelete}
                />
            </div>
            {sale_payments.data.length !== 0 && (
                <TablePagination data={sale_payments} />
            )}
            <DeleteModalLayout
                dataName={selectedSalePayment?.payment_number}
                dataId={selectedSalePayment?.id}
                dataType="Pembayaran Penjualan"
                isModalOpen={isDeleteModalOpen}
                onModalClose={closeDeleteModal}
                setSelected={setSelectedSalePayment}
                getDeleteUrl={(id) => destroySalePayment(id).url}
            />
        </AppLayout>
    );
};

export default SalePaymentIndex;
