import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Edit, Trash } from 'lucide-react';
import { Button } from '../../ui/button';
import { TableCell } from '../../ui/table';

interface City {
    id: number;
    name: string;
}

interface CityTableProps {
    cities: City[];
    onEdit: (city: City) => void;
    onDelete: (city: City) => void;
}

const CityTable = (props: CityTableProps) => {
    const { cities, onEdit, onDelete } = props;

    const tableColumn = ['Kode', 'Nama Kota', 'Aksi'];
    return (
        <TableLayout
            tableName="Kota"
            tableColumn={tableColumn}
            text="Tidak ada data kota"
            tableRow={cities}
            renderRow={(row) => (
                <>
                    <TableCell className="w-full items-center text-center">
                        {row.id}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
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

export default CityTable;
