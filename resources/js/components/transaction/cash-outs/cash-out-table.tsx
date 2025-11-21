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
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { CashOut } from '@/types';
import { Eye } from 'lucide-react';

interface CashOutTableProps {
    cashOuts: CashOut[];
    onView: (cashOut: CashOut) => void;
}

export default function CashOutTable({
    cashOuts,
    onView,
}: CashOutTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No. Kas Keluar</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Bank/Kas</TableHead>
                        <TableHead>Akun Pengeluaran</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cashOuts.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="text-center text-muted-foreground"
                            >
                                Tidak ada data kas keluar
                            </TableCell>
                        </TableRow>
                    ) : (
                        cashOuts.map((cashOut) => (
                            <TableRow key={cashOut.id}>
                                <TableCell className="font-medium">
                                    {cashOut.cash_out_number}
                                </TableCell>
                                <TableCell>
                                    {formatDatetoString(
                                        new Date(cashOut.cash_out_date),
                                    )}
                                </TableCell>
                                <TableCell>
                                    {cashOut.bank?.name || '-'}
                                </TableCell>
                                <TableCell>
                                    {cashOut.chart_of_account?.name || '-'}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(cashOut.amount)}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                    {cashOut.description || '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            cashOut.status === 'posted'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {cashOut.status === 'posted'
                                            ? 'Posted'
                                            : 'Draft'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onView(cashOut)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

