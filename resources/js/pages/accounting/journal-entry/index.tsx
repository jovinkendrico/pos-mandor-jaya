import JournalEntryTable from '@/components/accounting/journal-entries/journal-entry-table';
import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import { ReferenceType } from '@/constants/enum';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/journal-entries';
import { BreadcrumbItem, IJournalEntry, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';

interface PageProps {
    journalEntries: PaginatedData<IJournalEntry>;
    filters?: {
        search: string;
        date_from: string;
        date_to: string;
        status: string;
        reference_type: string;
        sort_by: string;
        sort_order: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Akuntansi',
        href: '#',
    },
    {
        title: 'Jurnal',
        href: '/journal-entries',
    },
];

const defaultFilters = {
    search: '',
    date_from: '',
    date_to: '',
    status: 'all',
    reference_type: 'all',
    sort_by: 'journal_date',
    sort_order: 'desc',
};

const JournalEntryIndex = (props: PageProps) => {
    const { journalEntries, filters = defaultFilters } = props;

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const handleView = (journalEntry: IJournalEntry) => {
        router.visit(`/journal-entries/${journalEntry.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jurnal" />
            <PageTitle title="Jurnal Umum" />
            <FilterBar
                filters={{
                    ...allFilters,
                    search: searchTerm,
                    status: allFilters.status ?? 'all',
                    reference_type: allFilters.reference_type ?? 'all',
                    sort_by: allFilters.sort_by ?? 'journal_date',
                    sort_order: allFilters.sort_order ?? 'desc',
                    date_from: allFilters.date_from ?? '',
                    date_to: allFilters.date_to ?? '',
                }}
                onFilterChange={handleFilterChange}
                defaultFilters={defaultFilters}
                showPaymentStatus={false}
                sortOptions={[
                    { value: 'journal_date', label: 'Tanggal' },
                    { value: 'journal_number', label: 'No. Jurnal' },
                ]}
                statusOptions={[
                    { value: 'all', label: 'Semua Status' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'posted', label: 'Posted' },
                ]}
                additionalFilters={
                    <div className="w-[180px]">
                        <Label htmlFor="reference_type">Tipe Referensi</Label>
                        <Select
                            value={allFilters.reference_type || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange({
                                    reference_type: value,
                                })
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
                                <SelectItem value={ReferenceType.MANUAL}>
                                    Manual
                                </SelectItem>
                                <SelectItem value={ReferenceType.PURCHASE}>
                                    Pembelian
                                </SelectItem>
                                <SelectItem value={ReferenceType.SALE}>
                                    Penjualan
                                </SelectItem>
                                <SelectItem value={ReferenceType.CASH_IN}>
                                    Kas Masuk
                                </SelectItem>
                                <SelectItem value={ReferenceType.CASH_OUT}>
                                    Kas Keluar
                                </SelectItem>
                                <SelectItem
                                    value={ReferenceType.PURCHASE_RETURN}
                                >
                                    Retur Pembelian
                                </SelectItem>
                                <SelectItem value={ReferenceType.SALE_RETURN}>
                                    Retur Penjualan
                                </SelectItem>
                                <SelectItem
                                    value={ReferenceType.STOCK_ADJUSTMENT}
                                >
                                    Penyesuaian Stok
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                }
            />
            <div className="mt-4">
                <JournalEntryTable
                    journalEntries={journalEntries.data}
                    pageFrom={journalEntries.from}
                    onView={handleView}
                />
            </div>
            {journalEntries.data.length !== 0 && (
                <TablePagination data={journalEntries} />
            )}
        </AppLayout>
    );
};

export default JournalEntryIndex;
