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
        <>
            <div className="hidden md:block">
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
            </div>

            <div className="md:hidden space-y-4">
                {banks.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground bg-card rounded-lg border">
                        Tidak ada data Bank/Cash
                    </div>
                ) : (
                    banks.map((row) => (
                        <div key={row.id} className="bg-card rounded-lg border p-4 space-y-3 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-bold text-base uppercase tracking-tight">{row.name}</p>
                                    <Badge
                                        variant={row.type === 'bank' ? 'default' : 'secondary'}
                                        className={cn(
                                            "text-[10px] px-2 py-0 h-5",
                                            row.type === 'bank' ? 'badge-yellow-light' : 'badge-green-light'
                                        )}
                                    >
                                        {row.type === 'bank' ? 'Bank' : 'Cash'}
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Saldo</p>
                                    <p className="font-bold text-lg">{formatCurrency(row.balance)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-1.5 text-xs pt-2 border-t">
                                {row.chart_of_account && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">COA:</span>
                                        <span className="font-mono">{row.chart_of_account.code} - {row.chart_of_account.name}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">No. Rekening:</span>
                                    <span className="font-medium">{row.account_number || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Nama Pemilik:</span>
                                    <span className="font-medium">{row.account_name || '-'}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <Link href={`/banks/${row.id}/cash-movement`}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="btn-info h-9 w-9 p-0"
                                        title="Pergerakan Kas"
                                    >
                                        <TrendingUp className="h-4 w-4" />
                                    </Button>
                                </Link>
                                {onEdit && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(row)}
                                        className="btn-edit h-9 w-9 p-0"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}
                                {onDelete && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDelete(row)}
                                        className="btn-trash h-9 w-9 p-0"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};

export default BankTable;
