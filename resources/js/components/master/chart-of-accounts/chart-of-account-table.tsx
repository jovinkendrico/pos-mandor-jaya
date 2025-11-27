import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { cn } from '@/lib/utils';
import { IChartOfAccount } from '@/types';
import { Edit, Trash } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { TableCell } from '../../ui/table';

interface ChartOfAccountTableProps {
    chartOfAccounts: IChartOfAccount[];
    onEdit: (chartOfAccount: IChartOfAccount) => void;
    onDelete: (chartOfAccount: IChartOfAccount) => void;
    pageFrom?: number;
}

const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        asset: 'Aset',
        liability: 'Kewajiban',
        equity: 'Ekuitas',
        income: 'Pendapatan',
        expense: 'Biaya',
    };
    return labels[type] || type;
};

const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
        asset: 'badge-blue-light',
        liability: 'badge-yellow-light',
        equity: 'badge-purple-light',
        income: 'badge-green-light',
        expense: 'badge-red-light',
    };
    return colors[type] || '';
};

const ChartOfAccountTable = (props: ChartOfAccountTableProps) => {
    const { chartOfAccounts, onEdit, onDelete, pageFrom } = props;

    const tableColumn = [
        'Kode',
        'Nama Akun',
        'Tipe',
        'Parent',
        'Status',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Chart of Account"
            tableColumn={tableColumn}
            tableRow={chartOfAccounts}
            text="Tidak ada data Chart of Account"
            pageFrom={pageFrom}
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        <span className="font-mono">{row.code}</span>
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.parent_id ? (
                            <span className="ml-4 text-muted-foreground">
                                └─ {row.name}
                            </span>
                        ) : (
                            <span className="font-semibold">{row.name}</span>
                        )}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        <Badge className={cn(getTypeColor(row.type))}>
                            {getTypeLabel(row.type)}
                        </Badge>
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.parent?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        <Badge
                            variant={row.is_active ? 'default' : 'secondary'}
                            className={cn(
                                row.is_active
                                    ? 'badge-green-light'
                                    : 'badge-red-light',
                            )}
                        >
                            {row.is_active ? 'Aktif' : 'Nonaktif'}
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

export default ChartOfAccountTable;
