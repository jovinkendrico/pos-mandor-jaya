import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatNumberWithSeparator } from '@/lib/utils';
import { TableCell } from '@/components/ui/table';
import { Eye, Trash } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { show } from '@/routes/stock-adjustments';

interface StockAdjustment {
    id: number;
    item_id: number;
    item?: {
        id: number;
        name: string;
        code?: string;
    };
    quantity: number;
    unit_cost: number;
    movement_date: string;
    notes?: string;
    created_at: string;
}

interface StockAdjustmentTableProps {
    adjustments: StockAdjustment[];
    onDelete?: (adjustment: StockAdjustment) => void;
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
                            variant={row.quantity > 0 ? 'default' : 'destructive'}
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
                                className="btn-view"
                            >
                                <Eye />
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

