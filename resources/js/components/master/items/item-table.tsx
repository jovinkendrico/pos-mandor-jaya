import TableLayout from '@/components/TableLayout/TableLayout';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';

interface ItemUom {
    id: number;
    uom_name: string;
    conversion_value: number;
    price: string;
    is_base: boolean;
}

interface Item {
    id: number;
    code: string;
    name: string;
    base_uom: string;
    stock: string;
    description?: string;
    uoms?: ItemUom[];
}

interface ItemTableProps {
    items: Item[];
    onEdit?: (item: Item) => void;
    onDelete?: (item: Item) => void;
}

const ItemTable = (props: ItemTableProps) => {
    const { items, onEdit, onDelete } = props;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

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
            text="Tidak ada data barang"
            renderRow={(row) => (
                <>
                    <TableCell className="w-full items-center text-center">
                        {row.code}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.name}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.base_uom}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.stock}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.uoms?.map((u) => u.uom_name).join(', ')}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.uoms
                            ?.map((u) => formatCurrency(parseFloat(u.price)))
                            .join(', ')}
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
