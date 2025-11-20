import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { ISale } from '@/types';
import { Link } from '@inertiajs/react';
import { Info, Trash } from 'lucide-react';

interface SaleTableProps {
    sales: ISale[];
    pageFrom: number;
    onDelete: (sale: ISale) => void;
}

const SaleTable = (props: SaleTableProps) => {
    const { sales, pageFrom, onDelete } = props;
    const tableColumn = [
        'Kode',
        'Customer',
        'Tanggal',
        'Jatuh Tempo',
        'Total',
        'Profit',
        'Sudah Dibayar',
        'Sisa',
        'Status Pembayaran',
        'Status',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Penjualan"
            tableColumn={tableColumn}
            tableRow={sales}
            pageFrom={pageFrom}
            text="Tidak ada data Penjualan"
            renderRow={(row) => {
                const remaining =
                    row.remaining_amount ?? Number(row.total_amount);
                const isPaid = remaining <= 0;
                return (
                    <>
                        <TableCell className="flex w-full max-w-[120px] min-w-[105px] items-center justify-center text-center font-mono">
                            {row.sale_number}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {row.customer?.name || '-'}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatDatetoString(new Date(row.sale_date))}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {row.due_date
                                ? formatDatetoString(new Date(row.due_date))
                                : '-'}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatCurrency(Number(row.total_amount))}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center text-green-600 dark:text-green-500">
                            {row.status === 'confirmed'
                                ? formatCurrency(Number(row.total_profit))
                                : '-'}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatCurrency(row.total_paid || 0)}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatCurrency(row.remaining_amount || 0)}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            <Badge variant={isPaid ? 'success' : 'warning'}>
                                {isPaid ? 'Lunas' : 'Belum Lunas'}
                            </Badge>
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            <Badge
                                variant={
                                    row.status === 'confirmed'
                                        ? 'default'
                                        : 'secondary'
                                }
                                className={cn(
                                    row.status === 'pending'
                                        ? 'badge-yellow-light'
                                        : 'badge-green-light',
                                )}
                            >
                                {row.status === 'confirmed'
                                    ? 'Confirmed'
                                    : 'Pending'}
                            </Badge>
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                            <Link href={`/sales/${row.id}`}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="btn-info"
                                >
                                    <Info />
                                </Button>
                            </Link>
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
                );
            }}
        />
    );
};

export default SaleTable;
