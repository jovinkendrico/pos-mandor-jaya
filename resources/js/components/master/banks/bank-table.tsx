import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Edit, Trash } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { TableCell } from '../../ui/table';

interface Bank {
    id: number;
    name: string;
    type: 'bank' | 'cash';
    account_number?: string;
    account_name?: string;
    balance?: number;
    description?: string;
}

interface BankTableProps {
    banks: Bank[];
    onEdit: (bank: Bank) => void;
    onDelete: (bank: Bank) => void;
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
        '#',
        'Nama',
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
            text="Tidak ada data bank/cash"
            renderRow={(row) => (
                <>
                    <TableCell className="w-full items-center text-center">
                        {row.id}
                    </TableCell>
                    <TableCell className="w-full text-center font-medium">
                        {row.name}
                    </TableCell>
                    <TableCell className="w-full text-center">
                        <Badge
                            variant={
                                row.type === 'bank' ? 'default' : 'secondary'
                            }
                        >
                            {row.type === 'bank' ? 'Bank' : 'Cash'}
                        </Badge>
                    </TableCell>
                    <TableCell className="w-full text-center">
                        {row.account_number || '-'}
                    </TableCell>
                    <TableCell className="w-full text-center">
                        {row.account_name || '-'}
                    </TableCell>
                    <TableCell className="w-full text-right font-medium">
                        {formatCurrency(row.balance)}
                    </TableCell>
                    <TableCell className="w-full text-center">
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

export default BankTable;
