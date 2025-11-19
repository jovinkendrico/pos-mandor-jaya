import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { IUOM } from '@/types';
import { Edit, Trash } from 'lucide-react';

interface UOMTableProps {
    uoms: IUOM[];
    onEdit: (uom: IUOM) => void;
    onDelete: (uom: IUOM) => void;
    pageFrom?: number;
}

const UOMTable = (props: UOMTableProps) => {
    const { uoms, onEdit, onDelete, pageFrom } = props;

    const tableColumn = ['Nama UOM', 'Aksi'];
    return (
        <TableLayout
            tableName="UOM"
            tableColumn={tableColumn}
            tableRow={uoms}
            text="Tidak ada data UOM"
            pageFrom={pageFrom}
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.name}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(row)}
                            className="btn-edit"
                        >
                            <Edit />
                        </Button>
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

export default UOMTable;
