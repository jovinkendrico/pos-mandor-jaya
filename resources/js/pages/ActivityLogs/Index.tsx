import { Breadcrumbs } from '@/components/breadcrumbs';
import PageTitle from '@/components/page-title';
import AppLayout from '@/layouts/app-layout';
import { ActivityLog, BreadcrumbItem, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import ActivityLogTable from '@/components/activity-logs/activity-log-table';
import ActivityLogDetail from '@/components/activity-logs/activity-log-detail';
import { Input } from '@/components/ui/input';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDebounce from '@/hooks/use-debounce';
import { useEffect } from 'react';

interface Props {
    logs: PaginatedData<ActivityLog>;
    filters: {
        search?: string;
        user_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Audit Logs',
        href: '/activity-logs',
    },
];

export default function Index({ logs, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            router.get(
                '/activity-logs',
                { ...filters, search: debouncedSearch },
                { preserveState: true, replace: true }
            );
        }
    }, [debouncedSearch]);

    const handleShowDetail = (log: ActivityLog) => {
        setSelectedLog(log);
        setIsDetailOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Logs" />

            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <PageTitle title="Audit Logs" />
                    <div className="w-full sm:w-64">
                        <Input
                            placeholder="Cari aksi atau model..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <ActivityLogTable
                        logs={logs}
                        onShowDetail={handleShowDetail}
                    />
                    <div className="p-4 border-t">
                        <TablePagination data={logs} />
                    </div>
                </div>
            </div>

            <ActivityLogDetail
                log={selectedLog}
                isOpen={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
        </AppLayout>
    );
}
