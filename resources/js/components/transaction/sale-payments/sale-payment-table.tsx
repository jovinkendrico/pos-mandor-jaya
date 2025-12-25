import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { SalePaymentStatus } from '@/constants/enum';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { ISalePayment } from '@/types';
import { Link } from '@inertiajs/react';
import { Info, Trash } from 'lucide-react';

interface SalePaymentTableProps {
    payments: ISalePayment[];
    pageFrom?: number;
    onDelete: (payment: ISalePayment) => void;
}

const SalePaymentTable = ({
    payments,
    pageFrom,
    onDelete,
}: SalePaymentTableProps) => {
    const tableColumn = [
        'Kode',
        'Customer',
        'Tanggal Pembayaran',
        'Jumlah Invoice',
        'Total',
        'Metode',
        'Bank',
        'Status',
        'Created By',
        'Updated By',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Pembayaran Penjualan"
            tableColumn={tableColumn}
            tableRow={payments}
            pageFrom={pageFrom}
            text="Tidak ada data Pembayaran Penjualan"
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full min-w-[105px] items-center justify-center text-center font-mono">
                        {row.payment_number}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.sales?.[0]?.customer?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatDatetoString(new Date(row.payment_date))}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.items?.length || row.sales?.length || 0} invoice
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatCurrency(row.total_amount)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.payment_method}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.bank?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        <Badge
                            className={cn(
                                row.status === SalePaymentStatus.PENDING
                                    ? 'badge-yellow-light'
                                    : 'badge-green-light',
                            )}
                        >
                            {row.status === SalePaymentStatus.CONFIRMED
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
                        <Link href={`/sale-payments/${row.id}`}>
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

export default SalePaymentTable;
