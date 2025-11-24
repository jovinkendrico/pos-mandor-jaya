import PageTitle from '@/components/page-title';
import JournalEntryTable from '@/components/accounting/journal-entries/journal-entry-table';
import { Button } from '@/components/ui/button';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, JournalEntry, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Eye } from 'lucide-react';

interface PageProps {
    journalEntries: PaginatedData<JournalEntry>;
    filters?: {
        search: string;
        date_from: string;
        date_to: string;
        status: string;
        reference_type: string;
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

export default function JournalEntryIndex({
    journalEntries,
    filters = {
        search: '',
        date_from: '',
        date_to: '',
        status: 'all',
        reference_type: 'all',
    },
}: PageProps) {
    const handleView = (journalEntry: JournalEntry) => {
        router.visit(`/journal-entries/${journalEntry.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jurnal" />
            <PageTitle title="Jurnal Umum" />
            <JournalEntryTable
                journalEntries={journalEntries.data}
                onView={handleView}
            />
            {journalEntries.data.length !== 0 && (
                <TablePagination data={journalEntries} />
            )}
        </AppLayout>
    );
}

