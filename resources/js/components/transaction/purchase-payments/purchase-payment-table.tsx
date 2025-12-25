import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { PurchasePaymentStatus } from '@/constants/enum';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { IPurchasePayment } from '@/types';
import { Link } from '@inertiajs/react';
import { Info, Trash } from 'lucide-react';

interface PurchasePaymentTableProps {
    purchase_payments: IPurchasePayment[];
    pageFrom?: number;
    onDelete: (payment: IPurchasePayment) => void;
}

const PurchasePaymentTable = (props: PurchasePaymentTableProps) => {
    const { purchase_payments, pageFrom, onDelete } = props;
    const tableColumn = [
        'Kode',
        'Supplier',
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
            tableName="Pembayaran Pembelian"
            tableColumn={tableColumn}
            tableRow={purchase_payments}
            pageFrom={pageFrom}
            text="Tidak ada data Pembayaran Pembelian"
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full min-w-[105px] items-center justify-center text-center font-mono">
                        {row.payment_number}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.purchases?.[0]?.supplier?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatDatetoString(new Date(row.payment_date))}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.items?.length || row.purchases?.length || 0}{' '}
                        invoice
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
                                row.status === PurchasePaymentStatus.PENDING
                                    ? 'badge-yellow-light'
                                    : 'badge-green-light',
                            )}
                        >
                            {row.status === PurchasePaymentStatus.CONFIRMED
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
                        <Link href={`/purchase-payments/${row.id}`}>
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

export default PurchasePaymentTable;
