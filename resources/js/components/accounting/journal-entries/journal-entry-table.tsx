import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { JournalEntry } from '@/types';
import { Eye } from 'lucide-react';

interface JournalEntryTableProps {
    journalEntries: JournalEntry[];
    onView: (journalEntry: JournalEntry) => void;
}

export default function JournalEntryTable({
    journalEntries,
    onView,
}: JournalEntryTableProps) {
    const formatStatus = (status: string) => {
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
            posted: { label: 'Posted', variant: 'default' },
            draft: { label: 'Draft', variant: 'secondary' },
            reversed: { label: 'Reversed', variant: 'destructive' },
        };
        return statusMap[status] || { label: status, variant: 'secondary' };
    };

    const formatReferenceType = (type?: string) => {
        if (!type) return '-';
        const typeMap: Record<string, string> = {
            CashIn: 'Kas Masuk',
            CashOut: 'Kas Keluar',
            SalePayment: 'Pembayaran Penjualan',
            PurchasePayment: 'Pembayaran Pembelian',
            Sale: 'Penjualan',
            Purchase: 'Pembelian',
            SaleReturn: 'Retur Penjualan',
            PurchaseReturn: 'Retur Pembelian',
            Manual: 'Manual',
        };
        return typeMap[type] || type;
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No. Jurnal</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Referensi</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead className="text-right">Total Debit</TableHead>
                        <TableHead className="text-right">Total Kredit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {journalEntries.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="text-center text-muted-foreground"
                            >
                                Tidak ada data jurnal
                            </TableCell>
                        </TableRow>
                    ) : (
                        journalEntries.map((entry) => {
                            const statusInfo = formatStatus(entry.status);
                            return (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-medium">
                                        {entry.journal_number}
                                    </TableCell>
                                    <TableCell>
                                        {formatDatetoString(
                                            new Date(entry.journal_date),
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {formatReferenceType(entry.reference_type)}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {entry.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(entry.total_debit || 0)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(entry.total_credit || 0)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusInfo.variant}>
                                            {statusInfo.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onView(entry)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

