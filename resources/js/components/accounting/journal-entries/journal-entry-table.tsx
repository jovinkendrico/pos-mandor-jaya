import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { ReferenceType } from '@/constants/enum';
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { IJournalEntry } from '@/types';
import { Eye } from 'lucide-react';

interface JournalEntryTableProps {
    journalEntries: IJournalEntry[];
    pageFrom?: number;
    onView: (journalEntry: IJournalEntry) => void;
}

const JournalEntryTable = (props: JournalEntryTableProps) => {
    const { journalEntries, pageFrom, onView } = props;

    const formatStatus = (status: string) => {
        const statusMap: Record<
            string,
            {
                label: string;
                className:
                    | 'badge-yellow-light'
                    | 'badge-green-light'
                    | 'badge-red-light';
            }
        > = {
            posted: { label: 'Posted', className: 'badge-green-light' },
            draft: { label: 'Draft', className: 'badge-yellow-light' },
            reversed: { label: 'Reversed', className: 'badge-red-light' },
        };
        return (
            statusMap[status] || {
                label: status,
                className: 'badge-yellow-light',
            }
        );
    };

    const formatReferenceType = (type?: string) => {
        if (!type) return '-';
        const typeMap: Record<string, string> = {
            [ReferenceType.CASH_IN]: 'Kas Masuk',
            [ReferenceType.CASH_OUT]: 'Kas Keluar',
            [ReferenceType.SALE_PAYMENT]: 'Pembayaran Penjualan',
            [ReferenceType.PURCHASE_PAYMENT]: 'Pembayaran Pembelian',
            [ReferenceType.SALE]: 'Penjualan',
            [ReferenceType.PURCHASE]: 'Pembelian',
            [ReferenceType.SALE_RETURN]: 'Retur Penjualan',
            [ReferenceType.PURCHASE_RETURN]: 'Retur Pembelian',
            [ReferenceType.MANUAL]: 'Manual',
            [ReferenceType.STOCK_ADJUSTMENT]: 'Penyesuaian Stok',
        };
        return typeMap[type] || type;
    };

    const tableColumn = [
        'No. Jurnal',
        'Tanggal',
        'Referensi',
        'Keterangan',
        'Total Debit',
        'Total Kredit',
        'Status',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Jurnal Umum"
            tableColumn={tableColumn}
            tableRow={journalEntries}
            pageFrom={pageFrom}
            text="Tidak ada data jurnal"
            renderRow={(entry) => {
                const statusInfo = formatStatus(entry.status);
                return (
                    <>
                        <TableCell className="flex w-full min-w-[105px] items-center justify-center text-center font-mono">
                            {entry.journal_number}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatDatetoString(new Date(entry.journal_date))}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatReferenceType(entry.reference_type)}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {entry.description || '-'}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatCurrency(entry.total_debit || 0)}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatCurrency(entry.total_credit || 0)}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            <Badge className={statusInfo.className}>
                                {statusInfo.label}
                            </Badge>
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onView(entry)}
                                className="btn-info"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </>
                );
            }}
        />
    );
};

export default JournalEntryTable;
