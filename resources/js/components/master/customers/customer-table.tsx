import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Button } from '@/components/ui/button';
import { ICustomer } from '@/types';
import { Edit, Trash } from 'lucide-react';
import { TableCell } from '../../ui/table';

interface CustomerTableProps {
    customers: ICustomer[];
    onEdit: (customer: ICustomer) => void;
    onDelete: (customer: ICustomer) => void;
    pageFrom?: number;
}

const CustomerTable = (props: CustomerTableProps) => {
    const { customers, onEdit, onDelete, pageFrom } = props;

    const tableColumn = [
        'Nama Customer',
        'Alamat',
        'Kota',
        'No. Telepon',
        'Contact Person',
        'Aksi',
    ];
    return (
        <TableLayout
            tableName="Customer"
            tableColumn={tableColumn}
            tableRow={customers}
            text="Tidak ada data Customer"
            pageFrom={pageFrom}
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.name}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.address || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.city?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.phone_number || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.contact || '-'}
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

export default CustomerTable;
