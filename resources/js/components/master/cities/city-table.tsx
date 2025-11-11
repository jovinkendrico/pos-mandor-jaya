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
    pageFrom?: number;
}

const CityTable = (props: CityTableProps) => {
    const { cities, onEdit, onDelete, pageFrom } = props;

    const tableColumn = ['Kode', 'Nama Kota', 'Aksi'];
    return (
        <TableLayout
            tableName="Kota"
            tableColumn={tableColumn}
            text="Tidak ada data kota"
            pageFrom={pageFrom}
            tableRow={cities}
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.id}
                    </TableCell>
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

export default CityTable;
