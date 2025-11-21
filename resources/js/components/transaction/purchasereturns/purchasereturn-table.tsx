import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { IPurchaseReturn } from '@/types';
import { Link } from '@inertiajs/react';
import { Info, Trash } from 'lucide-react';

interface PurchaseReturnTableProps {
    purchase_returns: IPurchaseReturn[];
    pageFrom?: number;
    onDelete: (purchase_return: IPurchaseReturn) => void;
}

const PurchaseReturnTable = (props: PurchaseReturnTableProps) => {
    const { purchase_returns, pageFrom, onDelete } = props;

    const tableColumn = [
        'Kode Retur',
        'Kode Pembelian',
        'Supplier',
        'Tanggal Retur',
        'Total',
        'Status',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Retur Pembelian"
            tableColumn={tableColumn}
            tableRow={purchase_returns}
            pageFrom={pageFrom}
            text="Tidak ada data Retur Pembelian"
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center font-mono">
                        {row.return_number}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center font-mono">
                        {row.purchase.purchase_number}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.purchase.supplier?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatDatetoString(new Date(row.return_date))}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatCurrency(row.total_amount)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        <Badge
                            variant={
                                row.status === 'confirmed'
                                    ? 'default'
                                    : 'secondary'
                            }
                            className={cn(
                                row.status === 'pending'
                                    ? 'badge-yellow-light'
                                    : 'badge-green-light',
                            )}
                        >
                            {row.status === 'confirmed'
                                ? 'Confirmed'
                                : 'Pending'}
                        </Badge>
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                        <Link href={`/purchase-returns/${row.id}`}>
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

export default PurchaseReturnTable;
