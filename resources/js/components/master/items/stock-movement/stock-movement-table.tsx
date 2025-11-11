import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import {
    formatDate,
    formatNumber,
    formatNumberWithSeparator,
} from '@/lib/utils';
import { IItemStockMovement } from '@/types';
import { Edit, Trash } from 'lucide-react';

interface StockMovementTableProps {
    stock_movements: IItemStockMovement[];
    onEdit?: (stock_movement: IItemStockMovement) => void;
    onDelete?: (stock_movement: IItemStockMovement) => void;
    pageFrom?: number;
}

const StockMovementTable = (props: StockMovementTableProps) => {
    const { stock_movements, onEdit, onDelete, pageFrom } = props;

    const tableColumn = [
        'Harga per Unit',
        'Sisa kuantitas',
        'Tanggal Pemindahan',
        'Catatan',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Stock Movement"
            tableColumn={tableColumn}
            tableRow={stock_movements}
            text="Tidak ada data perpindahan stok"
            pageFrom={pageFrom}
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatNumberWithSeparator(row.unit_cost)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatNumber(row.remaining_quantity)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatDate(row.movement_date)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.notes ?? '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit?.(row)}
                            className="btn-edit"
                        >
                            <Edit />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete?.(row)}
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

export default StockMovementTable;
