import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import SaleTable from '@/components/transaction/sales/sale-table';
import FilterBar from '@/components/transaction/filter-bar';
import AppLayout from '@/layouts/app-layout';
import { index, create } from '@/routes/sales';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

interface Customer {
    id: number;
    name: string;
}

interface Sale {
    id: number;
    sale_number: string;
    customer?: Customer;
    sale_date: string;
    due_date?: string;
    total_amount: string;
    total_profit: string;
    total_paid?: number;
    remaining_amount?: number;
    status: 'pending' | 'confirmed';
}

interface PageProps {
    sales: {
        data: Sale[];
    };
    filters?: {
        search: string;
        status: string;
        payment_status: string;
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

export default function SaleIndex({ sales, filters = {
    search: '',
    status: 'all',
    payment_status: 'all',
    date_from: '',
    date_to: '',
    sort_by: 'sale_date',
    sort_order: 'desc',
} }: PageProps) {
    const searchTimeoutRef = useRef<NodeJS.Timeout>();

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleView = (sale: Sale) => {
        router.visit(`/sales/${sale.id}`);
    };

    const handleFilterChange = useCallback((newFilters: Record<string, string>) => {
        // Debounce search input
        if (newFilters.search !== filters.search) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                router.get(index().url, newFilters, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            }, 500);
        } else {
            router.get(index().url, newFilters, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }
    }, [filters.search]);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Penjualan" />
                <div className="flex justify-between">
                    <PageTitle title="Penjualan" />
                    <Button onClick={handleCreate}>
                        <Plus />
                        Tambah Penjualan
                    </Button>
                </div>
                <FilterBar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    sortOptions={[
                        { value: 'sale_date', label: 'Tanggal' },
                        { value: 'sale_number', label: 'Nomor Penjualan' },
                        { value: 'total_amount', label: 'Total' },
                        { value: 'status', label: 'Status' },
                    ]}
                />
                <div className="mt-4">
                    <SaleTable sales={sales.data} onView={handleView} />
                </div>
            </AppLayout>
        </>
    );
}

