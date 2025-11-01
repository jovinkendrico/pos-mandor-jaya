import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { IItem } from '@/types';
import { Pencil, Trash2 } from 'lucide-react';

interface ItemTableProps {
    items: IItem[];
    onEdit?: (item: IItem) => void;
    onDelete?: (item: IItem) => void;
}

const ItemTable = (props: ItemTableProps) => {
    const { items, onEdit, onDelete } = props;

    const tableColumn = [
        'Kode',
        'Nama',
        'Base UOM',
        'Stock',
        'UOM Tersedia',
        'Harga Range',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Barang"
            tableColumn={tableColumn}
            tableRow={items}
            text="Tidak ada data Barang"
            renderRow={(row) => (
                <>
                    <TableCell className="w-full items-center text-center">
                        {row.id}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.name}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.stock}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.description}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.uoms?.map((u) => u.uom_name).join(', ')}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.uoms?.map((u) => u.price).join(', ')}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit?.(row)}
                        >
                            <Pencil />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete?.(row)}
                        >
                            <Trash2 />
                        </Button>
                    </TableCell>
                </>
            )}
        />
    );
};

export default ItemTable;
