import { usePermission } from '@/hooks/use-permission';
import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import SaleReturnTable from '@/components/transaction/salereturns/salereturn-table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { create, index } from '@/routes/sale-returns';
import { BreadcrumbItem, Customer, ISaleReturn, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    returns: PaginatedData<ISaleReturn>;
    customers?: Customer[];
    filters?: {
        search: string;
        date_from: string;
        date_to: string;
        status: string;
        return_type: string;
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
        title: 'Retur Jual',
        href: index().url,
    },
];

export default function SaleReturnIndex({
    returns,
    customers = [],
    filters = {
        search: '',
        date_from: '',
        date_to: '',
        status: 'all',
        return_type: 'all',
        customer_id: '',
        sort_by: 'return_date',
        sort_order: 'desc',
    },
}: PageProps) {
    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );
    const { hasPermission } = usePermission();

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleDelete = (saleReturn: ISaleReturn) => {
        if (confirm('Apakah Anda yakin ingin menghapus retur penjualan ini?')) {
            router.delete(`/sale-returns/${saleReturn.id}`, {
                onSuccess: () => {
                    toast.success('Retur penjualan berhasil dihapus');
                },
                onError: () => {
                    toast.error('Gagal menghapus retur penjualan');
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Retur Jual" />
            <div className="flex justify-between">
                <PageTitle title="Retur Penjualan" />
                {hasPermission('sale-returns.create') && (
                    <Button onClick={handleCreate} className="btn-primary">
                        <Plus />
                        Tambah Retur Jual
                    </Button>
                )}
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
                statusOptions={[
                    { value: 'all', label: 'Semua Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
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
                            <Label htmlFor="customer_id">Customer</Label>
                            <Select
                                value={allFilters.customer_id || undefined}
                                onValueChange={(value) =>
                                    handleFilterChange({
                                        customer_id: value || '',
                                    })
                                }
                            >
                                <SelectTrigger
                                    id="customer_id"
                                    className="combobox"
                                >
                                    <SelectValue placeholder="Semua Customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer) => (
                                        <SelectItem
                                            key={customer.id}
                                            value={customer.id.toString()}
                                        >
                                            {customer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                }
            />
            <div className="mt-4">
                <SaleReturnTable
                    returns={returns.data}
                    pageFrom={returns.from}
                    onDelete={handleDelete}
                />
            </div>
            {returns.data.length !== 0 && <TablePagination data={returns} />}
        </AppLayout>
    );
}
