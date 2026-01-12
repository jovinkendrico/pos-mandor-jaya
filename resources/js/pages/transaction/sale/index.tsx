import { usePermission } from '@/hooks/use-permission';
import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import SaleTable from '@/components/transaction/sales/sale-table';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import { Label } from '@/components/ui/label';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { create, destroy as destroySale, index } from '@/routes/sales';
import { BreadcrumbItem, ISale, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    sales: PaginatedData<ISale>;
    customers?: { id: number; name: string }[];
    filters?: {
        search: string;
        status: string;
        payment_status: string;
        customer_id: string;
        date_from: string;
        date_to: string;
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
        title: 'Penjualan',
        href: index().url,
    },
];

const SaleIndex = (props: PageProps) => {
    const {
        sales,
        customers = [],
        filters = {
            search: '',
            status: 'all',
            payment_status: 'all',
            customer_id: '',
            date_from: '',
            date_to: '',
            sort_by: 'sale_number',
            sort_order: 'desc',
        },
    } = props;

    const { hasPermission } = usePermission();

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const [selectedSale, setSelectedSale] = useState<ISale | undefined>(
        undefined,
    );

    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleDelete = (sale: ISale) => {
        setSelectedSale(sale);
        openDeleteModal();
    };

    const customerComboboxOptions: ComboboxOption[] = [
        { value: '', label: 'Semua Customer' },
        ...customers.map((customer) => ({
            value: customer.id.toString(),
            label: customer.name,
        })),
    ];

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Penjualan" />
                <div className="flex justify-between">
                    <PageTitle title="Penjualan" />
                    {hasPermission('sales.create') && (
                        <Button onClick={handleCreate} className="btn-primary">
                            <Plus />
                            Tambah Penjualan
                        </Button>
                    )}
                </div>
                <FilterBar
                    filters={{ ...allFilters, search: searchTerm }}
                    onFilterChange={handleFilterChange}
                    sortOptions={[
                        { value: 'sale_date', label: 'Tanggal' },
                        { value: 'sale_number', label: 'Nomor Penjualan' },
                        { value: 'total_amount', label: 'Total' },
                        { value: 'status', label: 'Status' },
                    ]}
                    additionalFilters={
                        <div className="w-[180px]">
                            <Label htmlFor="customer_id">Customer</Label>
                            <Combobox
                                options={customerComboboxOptions}
                                value={allFilters.customer_id || ''}
                                onValueChange={(value) =>
                                    handleFilterChange({
                                        customer_id: value || '',
                                    })
                                }
                                placeholder="Semua Customer"
                                searchPlaceholder="Cari customer..."
                                className="combobox"
                                maxDisplayItems={20}
                            />
                        </div>
                    }
                />

                <div className="mt-4">
                    <SaleTable
                        sales={sales.data}
                        pageFrom={sales.from}
                        onDelete={handleDelete}
                    />
                </div>

                {sales.data.length !== 0 && <TablePagination data={sales} />}
                <DeleteModalLayout
                    dataName={selectedSale?.sale_number}
                    dataId={selectedSale?.id}
                    dataType="Penjualan"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedSale}
                    getDeleteUrl={(id) => destroySale(id).url}
                />
            </AppLayout>
        </>
    );
};

export default SaleIndex;
