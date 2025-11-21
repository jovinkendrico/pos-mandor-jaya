import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import CashInTable from '@/components/transaction/cash-ins/cash-in-table';
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
import { index } from '@/routes/cash-ins';
import { BreadcrumbItem, Bank, CashIn, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface PageProps {
    cashIns: PaginatedData<CashIn>;
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
        title: 'Kas Masuk',
        href: '/cash-ins',
    },
];

export default function CashInIndex({
    cashIns,
    banks = [],
    filters = {
        search: '',
        date_from: '',
        date_to: '',
        status: 'all',
        bank_id: '',
        reference_type: 'all',
        sort_by: 'cash_in_date',
        sort_order: 'desc',
    },
}: PageProps) {
    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const handleCreate = () => {
        router.visit('/cash-ins/create');
    };

    const handleView = (cashIn: CashIn) => {
        router.visit(`/cash-ins/${cashIn.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kas Masuk" />
            <div className="flex justify-between">
                <PageTitle title="Kas Masuk" />
                <Button onClick={handleCreate} className="btn-primary">
                    <Plus />
                    Tambah Kas Masuk
                </Button>
            </div>
            <FilterBar
                filters={{ ...allFilters, search: searchTerm }}
                onFilterChange={handleFilterChange}
                showPaymentStatus={false}
                sortOptions={[
                    { value: 'cash_in_date', label: 'Tanggal' },
                    { value: 'cash_in_number', label: 'No. Kas Masuk' },
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
                                <SelectItem value="SalePayment">
                                    Pembayaran Penjualan
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>
            <div className="mt-4">
                <CashInTable cashIns={cashIns.data} onView={handleView} />
            </div>
            {cashIns.data.length !== 0 && <TablePagination data={cashIns} />}
        </AppLayout>
    );
}

