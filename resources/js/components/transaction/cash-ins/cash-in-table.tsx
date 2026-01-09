import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { ICashIn } from '@/types';
import { Link } from '@inertiajs/react';
import { Info, Trash } from 'lucide-react';
import { CashInStatus } from '@/constants/enum';

interface CashInTableProps {
    cashIns: ICashIn[];
    pageFrom: number;
    onDelete?: (cashIn: ICashIn) => void;
}

const CashInTable = (props: CashInTableProps) => {
    const { cashIns, pageFrom, onDelete } = props;

    const tableColumn = [
        'Kode',
        'Tanggal',
        'Bank/Kas',
        'Kode Perkiraan',
        'Jumlah',
        'Keterangan',
        'Status',
        'Created By',
        'Updated By',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Kas Masuk"
            tableColumn={tableColumn}
            tableRow={cashIns}
            pageFrom={pageFrom}
            text="Tidak ada data Kas Masuk"
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full max-w-[120px] min-w-[105px] items-center justify-center text-center font-mono">
                        {row.cash_in_number}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatDatetoString(new Date(row.cash_in_date))}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.bank?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.chart_of_account?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell className="flex w-full max-w-xs items-center justify-center truncate text-center">
                        {row.description || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        <Badge
                            className={cn(
                                row.status === CashInStatus.POSTED
                                    ? 'badge-green-light'
                                    : row.status === CashInStatus.CANCELLED
                                        ? 'badge-red-light'
                                        : 'badge-yellow-light',
                            )}
                        >
                            {row.status === CashInStatus.POSTED
                                ? 'Posted'
                                : row.status === CashInStatus.CANCELLED
                                    ? 'Dibatalkan'
                                    : 'Draft'}
                        </Badge>
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.creator?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.updater?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                        <Link href={`/cash-ins/${row.id}`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="btn-info"
                            >
                                <Info />
                            </Button>
                        </Link>
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(row)}
                                className="btn-trash"
                            >
                                <Trash />
                            </Button>
                        )}
                    </TableCell>
                </>
            )}
        />
    );
};

export default CashInTable;
