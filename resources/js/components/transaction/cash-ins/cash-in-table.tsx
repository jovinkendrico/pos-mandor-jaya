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
import { CashIn } from '@/types';
import { Eye } from 'lucide-react';

interface CashInTableProps {
    cashIns: CashIn[];
    onView: (cashIn: CashIn) => void;
}

export default function CashInTable({
    cashIns,
    onView,
}: CashInTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No. Kas Masuk</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Bank/Kas</TableHead>
                        <TableHead>Akun Pendapatan</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cashIns.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="text-center text-muted-foreground"
                            >
                                Tidak ada data kas masuk
                            </TableCell>
                        </TableRow>
                    ) : (
                        cashIns.map((cashIn) => (
                            <TableRow key={cashIn.id}>
                                <TableCell className="font-medium">
                                    {cashIn.cash_in_number}
                                </TableCell>
                                <TableCell>
                                    {formatDatetoString(
                                        new Date(cashIn.cash_in_date),
                                    )}
                                </TableCell>
                                <TableCell>
                                    {cashIn.bank?.name || '-'}
                                </TableCell>
                                <TableCell>
                                    {cashIn.chart_of_account?.name || '-'}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(cashIn.amount)}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                    {cashIn.description || '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            cashIn.status === 'posted'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {cashIn.status === 'posted'
                                            ? 'Posted'
                                            : 'Draft'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onView(cashIn)}
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

