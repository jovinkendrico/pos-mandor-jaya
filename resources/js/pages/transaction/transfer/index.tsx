import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BreadcrumbItem, ITransfer, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';

interface PageProps {
    transfers: PaginatedData<ITransfer>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Transfer Dana',
        href: '/transfers',
    },
];

const TransferIndex = (props: PageProps) => {
    const { transfers } = props;

    const handleCreate = () => {
        router.visit('/transfers/create');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transfer Dana" />
            <div className="flex justify-between">
                <PageTitle title="Transfer Dana" />
                <div className="flex gap-2">
                    <Button onClick={handleCreate} className="btn-primary">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Transfer
                    </Button>
                </div>
            </div>

            <div className="mt-6 rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Nomor Transfer</TableHead>
                            <TableHead>Dari Kas/Bank</TableHead>
                            <TableHead>Ke Kas/Bank</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead>Dibuat Oleh</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transfers.data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="h-24 text-center"
                                >
                                    Tidak ada data transfer.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transfers.data.map((transfer) => {
                                return (
                                    <TableRow key={transfer.id}>
                                        <TableCell>
                                            {formatDate(transfer.transfer_date)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">
                                                {transfer.transfer_number}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {transfer.from_bank?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {transfer.to_bank?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {transfer.description}
                                        </TableCell>
                                        <TableCell>
                                            {transfer.creator?.name || '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatCurrency(transfer.amount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm('Apakah Anda yakin ingin menghapus transfer ini?')) {
                                                        router.delete(`/transfers/${transfer.id}`);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            {transfers.data.length > 0 && <TablePagination data={transfers} />}
        </AppLayout>
    );
};

export default TransferIndex;
