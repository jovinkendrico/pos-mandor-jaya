import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import {
    formatCurrency,
    formatDatetoString,
    formatNumber,
    formatNumberWithSeparator,
    parseStringtoNumber,
} from '@/lib/utils';
import { IItemStockMovement } from '@/types';

interface StockMovementTableProps {
    stock_movements: IItemStockMovement[];
    onEdit?: (stock_movement: IItemStockMovement) => void;
    onDelete?: (stock_movement: IItemStockMovement) => void;
    pageFrom?: number;
    item_name: string;
}

const StockMovementTable = (props: StockMovementTableProps) => {
    const { stock_movements, pageFrom, item_name } = props;

    const tableColumn = [
        'Harga per Unit',
        'Sisa kuantitas',
        'Tanggal Pemindahan',
        'Catatan',
    ];

    return (
        <TableLayout
            tableName="Stock Movement"
            tableColumn={tableColumn}
            tableRow={stock_movements}
            text={`Tidak ada data perpindahan stok ${item_name}`}
            pageFrom={pageFrom}
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatCurrency(
                            parseStringtoNumber(String(row.unit_cost)),
                        )}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatNumberWithSeparator(
                            formatNumber(row.remaining_quantity),
                        )}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatDatetoString(new Date(row.movement_date))}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.notes ?? '-'}
                    </TableCell>
                    {/* <TableCell className="flex w-full items-center justify-center gap-2 text-center">
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
                    </TableCell> */}
                </>
            )}
        />
    );
};

export default StockMovementTable;
