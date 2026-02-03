import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { ISaleReturn } from '@/types';
import { Link, router } from '@inertiajs/react';
import { CheckCircle2, Edit, Info, RotateCcw, Trash } from 'lucide-react';
import { confirm as confirmRoute, unconfirm as unconfirmRoute, edit as editRoute } from '@/routes/sale-returns';

interface SaleReturnTableProps {
    returns: ISaleReturn[];
    pageFrom?: number;
    onDelete: (sale_return: ISaleReturn) => void;
}

export default function SaleReturnTable({
    returns,
    pageFrom,
    onDelete,
}: SaleReturnTableProps) {
    const handleConfirm = (id: number) => {
        if (confirm('Konfirmasi retur ini? Stok dan profit akan disesuaikan.')) {
            router.post(confirmRoute(id).url);
        }
    };

    const handleUnconfirm = (id: number) => {
        if (confirm('Batalkan konfirmasi retur ini? Stok akan dikurangi kembali.')) {
            router.post(unconfirmRoute(id).url);
        }
    };

    const tableColumn = [
        'No. Retur',
        'No. Penjualan',
        'Customer',
        'Tanggal Retur',
        'Total',
        'Profit Adj.',
        'Status',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Retur Penjualan"
            tableColumn={tableColumn}
            tableRow={returns}
            pageFrom={pageFrom}
            text="Tidak ada data Retur Penjualan"
            className="min-w-[135px]"
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center font-mono">
                        {row.return_number}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center font-mono">
                        {row.sale?.sale_number}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.sale?.customer?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatDatetoString(new Date(row.return_date))}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {formatCurrency(row.total_amount)}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center text-green-600 dark:text-emerald-500">
                        {row.status === 'confirmed'
                            ? formatCurrency(row.total_profit_adjustment || 0)
                            : '-'}
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
                        <Link href={`/sale-returns/${row.id}`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="btn-info"
                                title="Detail"
                            >
                                <Info className="h-4 w-4" />
                            </Button>
                        </Link>

                        {row.status === 'pending' && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleConfirm(row.id)}
                                    title="Konfirmasi"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Link href={editRoute(row.id).url}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        title="Edit"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(row)}
                                    className="btn-trash"
                                    title="Hapus"
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </>
                        )}

                        {row.status === 'confirmed' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => handleUnconfirm(row.id)}
                                title="Batal Konfirmasi"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}
                    </TableCell>
                </>
            )}
        />
    );
}
