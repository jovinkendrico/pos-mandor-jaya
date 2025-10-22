import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { UOM } from '@/types';
import { Edit, Trash } from 'lucide-react';

interface UOMTableProps {
    uoms: UOM[];
    onEdit: (uom: UOM) => void;
    onDelete: (uom: UOM) => void;
}

const UOMTable = (props: UOMTableProps) => {
    const { uoms, onEdit, onDelete } = props;

    const tableColumn = ['Kode', 'Name', 'Aksi'];
    return (
        <TableLayout
            tableName="UOM"
            tableColumn={tableColumn}
            tableRow={uoms}
            text="Tidak ada data UOM"
            renderRow={(row) => (
                <>
                    <TableCell className="w-full text-center">
                        {row.id}
                    </TableCell>
                    <TableCell className="w-full text-center">
                        {row.name}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(row)}
                        >
                            <Edit />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(row)}
                        >
                            <Trash className="text-destructive" />
                        </Button>
                    </TableCell>
                </>
            )}
        />
    );
};

export default UOMTable;
