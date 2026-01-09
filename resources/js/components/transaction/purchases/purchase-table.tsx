import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { PurchaseStatus } from '@/constants/enum';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { show } from '@/routes/purchases';
import { IPurchase } from '@/types';
import { Link } from '@inertiajs/react';
import { Info, Trash } from 'lucide-react';

interface PurchaseTableProps {
    purchases: IPurchase[];
    pageFrom?: number;
    onDelete: (purchase: IPurchase) => void;
}

const PurchaseTable = (props: PurchaseTableProps) => {
    const { purchases, pageFrom, onDelete } = props;

    const tableColumn = [
        'Kode',
        'Supplier',
        'Tanggal Pembelian',
        'Tanggal Jatuh Tempo',
        'Total',
        'Sudah Dibayar',
        'Sisa',
        'Status Pembayaran',
        'Status',
        'Created By',
        'Updated By',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Pembelian"
            tableColumn={tableColumn}
            tableRow={purchases}
            pageFrom={pageFrom}
            text="Tidak ada data Pembelian"
            renderRow={(row) => {
                const remaining =
                    row.remaining_amount ?? Number(row.total_amount);
                const isPaid = remaining <= 0;
                return (
                    <>
                        <TableCell className="flex w-full max-w-[120px] min-w-[105px] items-center justify-center text-center font-mono">
                            {row.purchase_number}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {row.supplier?.name || '-'}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatDatetoString(new Date(row.purchase_date))}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {row.due_date
                                ? formatDatetoString(new Date(row.due_date))
                                : '-'}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatCurrency(Number(row.total_amount))}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatCurrency(row.total_paid || 0)}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatCurrency(row.remaining_amount || 0)}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            <Badge
                                variant={isPaid ? 'success' : 'warning'}
                                className={cn(
                                    isPaid
                                        ? 'badge-blue-light'
                                        : 'badge-red-light',
                                )}
                            >
                                {isPaid ? 'Lunas' : 'Belum Lunas'}
                            </Badge>
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            <Badge
                                className={cn(
                                    row.status === PurchaseStatus.PENDING
                                        ? 'badge-yellow-light'
                                        : 'badge-green-light',
                                )}
                            >
                                {row.status === PurchaseStatus.CONFIRMED
                                    ? 'Confirmed'
                                    : 'Pending'}
                            </Badge>
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {row.creator?.name || '-'}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {row.updater?.name || '-'}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                            <Link href={show(row.id).url}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="btn-info"
                                >
                                    <Info />
                                </Button>
                            </Link>
                            {row.can?.delete && (
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
                );
            }}
        />
    );
};

export default PurchaseTable;
