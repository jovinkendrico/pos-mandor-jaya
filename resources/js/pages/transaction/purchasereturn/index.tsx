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
import PurchaseReturnTable from '@/components/transaction/purchasereturns/purchasereturn-table';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { index, create } from '@/routes/purchase-returns';
import { BreadcrumbItem, Supplier, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface PurchaseReturn {
    id: number;
    return_number: string;
    purchase: {
        id: number;
        purchase_number: string;
        supplier?: Supplier;
    };
    return_date: string;
    total_amount: string;
    status: 'pending' | 'confirmed';
    return_type?: 'stock_only' | 'stock_and_refund';
}

interface PageProps {
    returns: PaginatedData<PurchaseReturn>;
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

export default function PurchaseReturnIndex({
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
}: PageProps) {
    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleView = (returnData: PurchaseReturn) => {
        router.visit(`/purchase-returns/${returnData.id}`);
    };

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
                        <Label htmlFor="supplier_id">Supplier</Label>
                        <Select
                            value={allFilters.supplier_id || undefined}
                            onValueChange={(value) =>
                                handleFilterChange({ supplier_id: value || '' })
                            }
                        >
                            <SelectTrigger id="supplier_id" className="combobox">
                                <SelectValue placeholder="Semua Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map((supplier) => (
                                    <SelectItem
                                        key={supplier.id}
                                        value={supplier.id.toString()}
                                    >
                                        {supplier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>
            <div className="mt-4">
                <PurchaseReturnTable returns={returns.data} onView={handleView} />
            </div>
            {returns.data.length !== 0 && (
                <TablePagination data={returns} />
            )}
        </AppLayout>
    );
}

