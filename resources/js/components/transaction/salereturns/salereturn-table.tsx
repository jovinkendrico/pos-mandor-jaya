import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { ISaleReturn } from '@/types';
import { Link } from '@inertiajs/react';
import { Info, Trash } from 'lucide-react';

interface SaleReturnTableProps {
    returns: ISaleReturn[];
    pageFrom?: number;
    onDelete: (sale_return: ISaleReturn) => void;
}

export default function SaleReturnTable({
    returns,
    pageFrom,
    onDelete,
}: SaleReturnTableProps) {
    const tableColumn = [
        'No. Retur',
        'No. Penjualan',
        'Customer',
        'Tanggal Retur',
        'Total',
        'Profit Adj.',
        'Status',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Retur Penjualan"
            tableColumn={tableColumn}
            tableRow={returns}
            pageFrom={pageFrom}
            text="Tidak ada data Retur Penjualan"
            className="min-w-[135px]"
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center font-mono">
                        {row.return_number}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center font-mono">
                        {row.sale?.sale_number}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.sale?.customer?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatDatetoString(new Date(row.return_date))}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatCurrency(row.total_amount)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center text-green-600 dark:text-emerald-500">
                        {row.status === 'confirmed'
                            ? formatCurrency(row.total_profit_adjustment || 0)
                            : '-'}
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
                        <Link href={`/sale-returns/${row.id}`}>
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
}
