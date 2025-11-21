import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import SaleReturnTable from '@/components/transaction/salereturns/salereturn-table';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { index, create } from '@/routes/sale-returns';
import { BreadcrumbItem, Customer, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface SaleReturn {
    id: number;
    return_number: string;
    sale: {
        id: number;
        sale_number: string;
        customer?: Customer;
    };
    return_date: string;
    total_amount: string;
    total_profit_adjustment: string;
    status: 'pending' | 'confirmed';
    return_type?: 'stock_only' | 'stock_and_refund';
}

interface PageProps {
    returns: PaginatedData<SaleReturn>;
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

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleView = (returnData: SaleReturn) => {
        router.visit(`/sale-returns/${returnData.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Retur Jual" />
            <div className="flex justify-between">
                <PageTitle title="Retur Penjualan" />
                <Button onClick={handleCreate} className="btn-primary">
                    <Plus />
                    Tambah Retur Jual
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
                statusOptions={[
                    { value: 'all', label: 'Semua Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                ]}
            />
            <Card className="content mt-4 p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="w-[180px]">
                        <Label htmlFor="return_type">Tipe Retur</Label>
                        <Select
                            value={allFilters.return_type || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange({ return_type: value })
                            }
                        >
                            <SelectTrigger id="return_type" className="combobox">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="stock_only">Retur Stok Saja</SelectItem>
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
                                handleFilterChange({ customer_id: value || '' })
                            }
                        >
                            <SelectTrigger id="customer_id" className="combobox">
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
                </div>
            </Card>
            <div className="mt-4">
                <SaleReturnTable returns={returns.data} onView={handleView} />
            </div>
            {returns.data.length !== 0 && (
                <TablePagination data={returns} />
            )}
        </AppLayout>
    );
}

