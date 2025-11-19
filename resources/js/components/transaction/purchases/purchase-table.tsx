import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Eye } from 'lucide-react';
import { IPurchase } from '@/types';

interface PurchaseTableProps {
    purchases: IPurchase[];
    onView: (purchase: IPurchase) => void;
}

export default function PurchaseTable(props: PurchaseTableProps) {
    const { purchases, onView } = props;

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px]">No. Pembelian</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Sudah Dibayar</TableHead>
                        <TableHead className="text-right">Sisa</TableHead>
                        <TableHead className="text-center">Status Pembayaran</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center w-[100px]">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchases.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={10} className="text-center text-muted-foreground">
                                Tidak ada data Pembelian
                            </TableCell>
                        </TableRow>
                    ) : (
                        purchases.map((row) => {
                            const remaining = row.remaining_amount ?? Number(row.total_amount);
                            const isPaid = remaining <= 0;

                            return (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">{row.purchase_number}</TableCell>
                                    <TableCell>{row.supplier?.name || '-'}</TableCell>
                                    <TableCell>{formatDate(row.purchase_date)}</TableCell>
                                    <TableCell>{row.due_date ? formatDate(row.due_date) : '-'}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(Number(row.total_amount))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(row.total_paid || 0)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(remaining)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={isPaid ? 'success' : 'warning'}>
                                            {isPaid ? 'Lunas' : 'Belum Lunas'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={
                                                row.status === 'pending' ? 'warning' : 'success'
                                            }
                                        >
                                            {row.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => onView(row)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
