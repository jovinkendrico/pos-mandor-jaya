import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { ISupplier } from '@/types';
import { Edit, Trash } from 'lucide-react';
import { Button } from '../../ui/button';
import { TableCell } from '../../ui/table';

interface SupplierTableProps {
    suppliers: ISupplier[];
    onEdit: (supplier: ISupplier) => void;
    onDelete: (supplier: ISupplier) => void;
}

const SupplierTable = (props: SupplierTableProps) => {
    const { suppliers, onEdit, onDelete } = props;

    const tableColumn = [
        'Kode',
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
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.id}
                    </TableCell>
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
                    <TableCell className="flex w-full items-center justify-center text-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(row)}
                        >
                            <Edit />
                        </Button>
                        <Button
                            variant="destructive"
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
