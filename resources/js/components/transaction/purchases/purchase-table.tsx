import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { IPurchase } from '@/types';
import { Link } from '@inertiajs/react';
import { Info, Trash } from 'lucide-react';

interface PurchaseTableProps {
    purchases: IPurchase[];
    pageFrom?: number;
    onDelete: (purchase: IPurchase) => void;
}

export default function PurchaseTable(props: PurchaseTableProps) {
    const { purchases, pageFrom, onDelete } = props;

    const tableColumn = [
        'Kode',
        'Supplier',
        'Tanggal Pembelian',
        'Tanggal Jatuh Tempo',
        'Total',
        'Status',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Pembelian"
            tableColumn={tableColumn}
            tableRow={purchases}
            pageFrom={pageFrom}
            text="Tidak ada data Pembelian"
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.purchase_number}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.supplier?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatDate(row.purchase_date)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.due_date ? formatDate(row.due_date) : '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatCurrency(Number(row.total_amount))}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        <Badge
                            variant={
                                row.status === 'pending'
                                    ? 'default'
                                    : 'secondary'
                            }
                            className={cn(
                                row.status === 'pending'
                                    ? 'badge-yellow-light'
                                    : 'badge-green-light',
                            )}
                        >
                            {row.status === 'pending' ? 'Pending' : 'Confirmed'}
                        </Badge>
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                        <Link href={`/purchases/${row.id}`}>
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
