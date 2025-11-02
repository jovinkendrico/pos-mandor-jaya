import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { cn } from '@/lib/utils';
import { IBank } from '@/types';
import { Edit, Trash } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { TableCell } from '../../ui/table';

interface BankTableProps {
    banks: IBank[];
    onEdit: (bank: IBank) => void;
    onDelete: (bank: IBank) => void;
}

const BankTable = (props: BankTableProps) => {
    const { banks, onEdit, onDelete } = props;

    const formatCurrency = (value?: number) => {
        if (!value) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const tableColumn = [
        'Kode',
        'Nama Bank/Cash',
        'Tipe',
        'No. Rekening',
        'Nama Pemilik',
        'Saldo',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Bank"
            tableColumn={tableColumn}
            tableRow={banks}
            text="Tidak ada data Bank/Cash"
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.id}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.name}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        <Badge
                            variant={
                                row.type === 'bank' ? 'default' : 'secondary'
                            }
                            className={cn(
                                row.type === 'bank'
                                    ? 'badge-yellow-light'
                                    : 'badge-green-light',
                            )}
                        >
                            {row.type === 'bank' ? 'Bank' : 'Cash'}
                        </Badge>
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.account_number || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.account_name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center">
                        {formatCurrency(row.balance)}
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

export default BankTable;
