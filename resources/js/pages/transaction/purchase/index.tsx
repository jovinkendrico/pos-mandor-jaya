import PageTitle from '@/components/page-title';
import PurchaseTable from '@/components/transaction/purchases/purchase-table';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { create, index } from '@/routes/purchases';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Supplier {
    id: number;
    name: string;
}

interface Item {
    id: number;
    name: string;
}

interface ItemUom {
    id: number;
    uom_name: string;
}

interface PurchaseDetail {
    id: number;
    item: Item;
    item_uom: ItemUom;
    quantity: string;
    price: string;
    discount1_percent: string;
    discount2_percent: string;
    subtotal: string;
}

interface Purchase {
    id: number;
    purchase_number: string;
    supplier?: Supplier;
    purchase_date: string;
    due_date?: string;
    subtotal: string;
    total_amount: string;
    total_paid?: number;
    remaining_amount?: number;
    status: 'pending' | 'confirmed';
    details: PurchaseDetail[];
}

interface PageProps {
    purchases: {
        data: Purchase[];
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
        title: 'Pembelian',
        href: index().url,
    },
];

const PurchaseIndex = (props: PageProps) => {
    const { purchases, filters = {
        search: '',
        status: 'all',
        payment_status: 'all',
        date_from: '',
        date_to: '',
        sort_by: 'purchase_date',
        sort_order: 'desc',
    } } = props;
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | undefined>(undefined);
    const searchTimeoutRef = useRef<NodeJS.Timeout>();

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleView = (purchase: Purchase) => {
        router.visit(`/purchases/${purchase.id}`);
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
                <Head title="Pembelian" />
                <div className="flex justify-between">
                    <PageTitle title="Pembelian" />
                    <Button onClick={handleCreate} className="btn-primary">
                        <Plus />
                        Tambah Pembelian
                    </Button>
                </div>
                <FilterBar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    sortOptions={[
                        { value: 'purchase_date', label: 'Tanggal' },
                        { value: 'purchase_number', label: 'Nomor Pembelian' },
                        { value: 'total_amount', label: 'Total' },
                        { value: 'status', label: 'Status' },
                    ]}
                />
                <div className="mt-4">
                    <PurchaseTable purchases={purchases.data} onView={handleView} />
                </div>
            </AppLayout>
        </>
    );
};

export default PurchaseIndex;
