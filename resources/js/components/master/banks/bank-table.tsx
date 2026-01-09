import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { cn, formatCurrency } from '@/lib/utils';
import { IBank } from '@/types';
import { Link } from '@inertiajs/react';
import { Edit, Trash, TrendingUp } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { TableCell } from '../../ui/table';

interface BankTableProps {
    banks: IBank[];
    onEdit?: (bank: IBank) => void;
    onDelete?: (bank: IBank) => void;
    pageFrom?: number;
}

const BankTable = (props: BankTableProps) => {
    const { banks, onEdit, onDelete, pageFrom } = props;

    const tableColumn = [
        'Nama Bank/Cash',
        'Tipe',
        'Chart of Account',
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
            pageFrom={pageFrom}
            renderRow={(row) => (
                <>

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
                        {row.chart_of_account ? (
                            <span className="font-mono text-sm">
                                {row.chart_of_account.code} -{' '}
                                {row.chart_of_account.name}
                            </span>
                        ) : (
                            '-'
                        )}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.account_number || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.account_name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatCurrency(row.balance)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                        <Link href={`/banks/${row.id}/cash-movement`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="btn-info"
                                title="Pergerakan Kas"
                            >
                                <TrendingUp />
                            </Button>
                        </Link>
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(row)}
                                className="btn-edit"
                            >
                                <Edit />
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(row)}
                                className="btn-trash"
                            >
                                <Trash />
                            </Button>
                        )}
                    </TableCell>
                </>
            )}
        />
    );
};

export default BankTable;
