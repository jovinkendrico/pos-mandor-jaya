import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { IBranch } from '@/types';
import { Edit, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BranchTableProps {
    branches: IBranch[];
    onEdit: (branch: IBranch) => void;
    onDelete: (branch: IBranch) => void;
    pageFrom?: number;
}

const BranchTable = (props: BranchTableProps) => {
    const { branches, onEdit, onDelete, pageFrom } = props;

    const tableColumn = ['Kode', 'Nama', 'Alamat', 'Status', 'Aksi'];
    return (
        <TableLayout
            tableName="Branch"
            tableColumn={tableColumn}
            tableRow={branches}
            text="Tidak ada data Cabang"
            pageFrom={pageFrom}
            renderRow={(row) => (
                <>
                    <TableCell className="text-center">
                        {row.code}
                    </TableCell>
                    <TableCell className="text-center">
                        {row.name}
                    </TableCell>
                    <TableCell className="text-center">
                        {row.address || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                        <Badge variant={row.is_active ? 'default' : 'destructive'}>
                            {row.is_active ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
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

export default BranchTable;
