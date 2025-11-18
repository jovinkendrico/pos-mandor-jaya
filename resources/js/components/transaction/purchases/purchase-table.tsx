import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { formatCurrency } from '@/lib/utils';
import { IPurchase } from '@/types';
import { Eye } from 'lucide-react';

interface PurchaseTableProps {
    purchases: IPurchase[];
}

export default function PurchaseTable(props: PurchaseTableProps) {
    const { purchases } = props;

    const tableColumn = [
        'Supplier',
        'Tanggal',
        'Jatuh Tempo',
        'Total',
        'Status',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Pembelian"
            tableColumn={tableColumn}
            tableRow={purchases}
            text="Tidak ada data Pembelian"
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.supplier?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {''}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {''}
                    </TableCell>
                    <TableCell className="text-right">
                        {formatCurrency(Number(row.total_amount))}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        <Badge
                            variant={
                                row.status === 'pending' ? 'warning' : 'success'
                            }
                        >
                            {row.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {}}
                            className="btn-edit"
                        >
                            <Eye />
                        </Button>
                    </TableCell>
                </>
            )}
        />
    );
}
