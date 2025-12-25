import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { ICashOut } from '@/types';
import { Link } from '@inertiajs/react';
import { Info, Trash } from 'lucide-react';

interface CashOutTableProps {
    cashOuts: ICashOut[];
    pageFrom: number;
    onDelete: (cashOut: ICashOut) => void;
}

const CashOutTable = (props: CashOutTableProps) => {
    const { cashOuts, pageFrom, onDelete } = props;

    const tableColumn = [
        'Kode',
        'Tanggal',
        'Bank/Kas',
        'Akun Pengeluaran',
        'Jumlah',
        'Keterangan',
        'Status',
        'Created By',
        'Updated By',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Kas Keluar"
            tableColumn={tableColumn}
            tableRow={cashOuts}
            pageFrom={pageFrom}
            text="Tidak ada data Kas Keluar"
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full max-w-[120px] min-w-[105px] items-center justify-center text-center font-mono">
                        {row.cash_out_number}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatDatetoString(new Date(row.cash_out_date))}
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
                                row.status === 'posted'
                                    ? 'badge-green-light'
                                    : 'badge-yellow-light',
                            )}
                        >
                            {row.status === 'posted' ? 'Posted' : 'Draft'}
                        </Badge>
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.creator?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.updater?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                        <Link href={`/cash-outs/${row.id}`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="btn-info"
                            >
                                <Info />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(row)}
                            className="btn-trash"
                        >
                            <Trash />
                        </Button>
                    </TableCell>
                </>
            )}
        />
    );
};

export default CashOutTable;

