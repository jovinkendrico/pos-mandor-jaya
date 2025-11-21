import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import CashOutTable from '@/components/transaction/cash-outs/cash-out-table';
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
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/cash-outs';
import { BreadcrumbItem, Bank, CashOut, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface PageProps {
    cashOuts: PaginatedData<CashOut>;
    banks?: Bank[];
    filters?: {
        search: string;
        date_from: string;
        date_to: string;
        status: string;
        bank_id: string;
        reference_type: string;
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
        title: 'Kas Keluar',
        href: '/cash-outs',
    },
];

export default function CashOutIndex({
    cashOuts,
    banks = [],
    filters = {
        search: '',
        date_from: '',
        date_to: '',
        status: 'all',
        bank_id: '',
        reference_type: 'all',
        sort_by: 'cash_out_date',
        sort_order: 'desc',
    },
}: PageProps) {
    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const handleCreate = () => {
        router.visit('/cash-outs/create');
    };

    const handleView = (cashOut: CashOut) => {
        router.visit(`/cash-outs/${cashOut.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kas Keluar" />
            <div className="flex justify-between">
                <PageTitle title="Kas Keluar" />
                <Button onClick={handleCreate} className="btn-primary">
                    <Plus />
                    Tambah Kas Keluar
                </Button>
            </div>
            <FilterBar
                filters={{ ...allFilters, search: searchTerm }}
                onFilterChange={handleFilterChange}
                showPaymentStatus={false}
                sortOptions={[
                    { value: 'cash_out_date', label: 'Tanggal' },
                    { value: 'cash_out_number', label: 'No. Kas Keluar' },
                    { value: 'amount', label: 'Jumlah' },
                    { value: 'status', label: 'Status' },
                ]}
                statusOptions={[
                    { value: 'all', label: 'Semua Status' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'posted', label: 'Posted' },
                ]}
            />
            <Card className="content mt-4 p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="w-[180px]">
                        <Label htmlFor="bank_id">Bank/Kas</Label>
                        <Select
                            value={allFilters.bank_id || undefined}
                            onValueChange={(value) =>
                                handleFilterChange({ bank_id: value || '' })
                            }
                        >
                            <SelectTrigger id="bank_id" className="combobox">
                                <SelectValue placeholder="Semua Bank" />
                            </SelectTrigger>
                            <SelectContent>
                                {banks.map((bank) => (
                                    <SelectItem
                                        key={bank.id}
                                        value={bank.id.toString()}
                                    >
                                        {bank.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-[180px]">
                        <Label htmlFor="reference_type">Tipe Referensi</Label>
                        <Select
                            value={allFilters.reference_type || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange({ reference_type: value })
                            }
                        >
                            <SelectTrigger
                                id="reference_type"
                                className="combobox"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="manual">Manual</SelectItem>
                                <SelectItem value="PurchasePayment">
                                    Pembayaran Pembelian
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>
            <div className="mt-4">
                <CashOutTable cashOuts={cashOuts.data} onView={handleView} />
            </div>
            {cashOuts.data.length !== 0 && (
                <TablePagination data={cashOuts} />
            )}
        </AppLayout>
    );
}

