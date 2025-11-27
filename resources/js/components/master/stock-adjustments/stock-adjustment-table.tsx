import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import {
    cn,
    formatCurrency,
    formatDate,
    formatNumberWithSeparator,
} from '@/lib/utils';
import { show } from '@/routes/stock-adjustments';
import { IStockAdjustment } from '@/types';
import { Link } from '@inertiajs/react';
import { Info, Trash } from 'lucide-react';

interface StockAdjustmentTableProps {
    adjustments: IStockAdjustment[];
    onDelete?: (adjustment: IStockAdjustment) => void;
    pageFrom?: number;
}

const StockAdjustmentTable = (props: StockAdjustmentTableProps) => {
    const { adjustments, onDelete, pageFrom } = props;

    const tableColumn = [
        'Tanggal',
        'Barang',
        'Jumlah',
        'Harga Satuan',
        'Total',
        'Catatan',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Penyesuaian Stok"
            tableColumn={tableColumn}
            tableRow={adjustments}
            text="Tidak ada data penyesuaian stok"
            pageFrom={pageFrom}
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatDate(row.movement_date)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        <div className="text-left">
                            <div className="font-medium">
                                {row.item?.code || '-'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {row.item?.name || '-'}
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        <Badge
                            variant={row.quantity > 0 ? 'default' : 'outline'}
                            className={cn(
                                row.quantity > 0
                                    ? 'badge-green-light'
                                    : 'badge-red-light',
                            )}
                        >
                            {row.quantity > 0 ? '+' : ''}
                            {formatNumberWithSeparator(row.quantity)}
                        </Badge>
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatCurrency(row.unit_cost)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatCurrency(Math.abs(row.quantity) * row.unit_cost)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.notes || '-'}
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

export default StockAdjustmentTable;
