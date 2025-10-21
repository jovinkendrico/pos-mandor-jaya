import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { TableCell } from '../../ui/table';

interface City {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    address?: string;
    city?: City;
    phone_number?: string;
    contact?: string;
}

interface CustomerTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
}

const CustomerTable = (props: CustomerTableProps) => {
    const { customers, onEdit, onDelete } = props;

    const tableColumn = [
        '#',
        'Nama Customer',
        'Alamat',
        'Kota',
        'Telepon',
        'Contact Person',
        'Aksi',
    ];
    return (
        <TableLayout
            tableName="Customer"
            tableColumn={tableColumn}
            tableRow={customers}
            text="Tidak ada data customer"
            renderRow={(row) => (
                <>
                    <TableCell className="w-full items-center text-center">
                        {row.id}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.name}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.address || '-'}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.city?.name || '-'}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.phone_number || '-'}
                    </TableCell>
                    <TableCell className="w-full items-center text-center">
                        {row.contact || '-'}
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

export default CustomerTable;
