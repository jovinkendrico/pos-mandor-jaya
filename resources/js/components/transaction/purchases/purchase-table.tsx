import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { formatCurrency } from '@/lib/utils';
import { Eye } from 'lucide-react';

interface Supplier {
    id: number;
    name: string;
}

interface Purchase {
    id: number;
    purchase_number: string;
    supplier?: Supplier;
    purchase_date: string;
    due_date?: string;
    total_amount: string;
    status: 'pending' | 'confirmed';
}

interface PurchaseTableProps {
    purchases: Purchase[];
}

export default function PurchaseTable(props: PurchaseTableProps) {
    const { purchases } = props;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

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
                        {formatDate(row.purchase_date)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.due_date ? formatDate(row.due_date) : '-'}
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
