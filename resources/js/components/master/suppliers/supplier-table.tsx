import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Edit, Trash } from 'lucide-react';
import { Button } from '../../ui/button';
import { TableCell } from '../../ui/table';

interface City {
    id: number;
    name: string;
}

interface Supplier {
    id: number;
    name: string;
    address?: string;
    city?: City;
    phone_number?: string;
    contact?: string;
}

interface SupplierTableProps {
    suppliers: Supplier[];
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplier: Supplier) => void;
}

const SupplierTable = (props: SupplierTableProps) => {
    const { suppliers, onEdit, onDelete } = props;

    const tableColumn = [
        '#',
        'Nama Supplier',
        'Alamat',
        'Kota',
        'Telepon',
        'Contact Person',
        'Aksi',
    ];
    return (
        <TableLayout
            tableName="Supplier"
            tableColumn={tableColumn}
            tableRow={suppliers}
            text="Tidak ada data Supplier"
            renderRow={(row) => (
                <>
                    <TableCell className="text-center">{row.id}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.address || '-'}</TableCell>
                    <TableCell>{row.city?.name || '-'}</TableCell>
                    <TableCell>{row.phone_number || '-'}</TableCell>
                    <TableCell>{row.contact || '-'}</TableCell>
                    <TableCell className="text-center">
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
                            <Trash />
                        </Button>
                    </TableCell>
                </>
            )}
        />
    );
};

export default SupplierTable;
