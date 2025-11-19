import PageTitle from '@/components/page-title';
import PurchaseTable from '@/components/transaction/purchases/purchase-table';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { create, destroy as destroyPurchase, index } from '@/routes/purchases';
import {
    BreadcrumbItem,
    PageProps as InertiaPageProps,
    IPurchase,
    PaginatedData,
} from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface PageProps {
    purchases: {
        data: IPurchase[];
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
    const { flash } = usePage<InertiaPageProps>().props;
    const [selectedPurchase, setSelectedPurchase] = useState<IPurchase | undefined>(undefined);
    const searchTimeoutRef = useRef<NodeJS.Timeout>();

    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    useMemo(() => {
        if (
            flash?.success === 'Pembelian berhasil ditambahkan' ||
            flash?.success === 'Pembelian berhasil diperbarui'
        ) {
            toast.success(flash.success);
        }
    }, [flash]);

    const handleCreate = () => {
        router.visit(create().url);
    };

    const handleView = (purchase: IPurchase) => {
        router.visit(`/purchases/${purchase.id}`);
    };

    const handleDelete = (purchase: IPurchase) => {
        setSelectedPurchase(purchase);
        openDeleteModal();
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
