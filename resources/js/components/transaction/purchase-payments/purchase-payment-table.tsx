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
import { PurchasePayment } from '@/types';
import { Eye } from 'lucide-react';

interface PurchasePaymentTableProps {
    payments: PurchasePayment[];
    onView: (payment: PurchasePayment) => void;
}

export default function PurchasePaymentTable({
    payments,
    onView,
}: PurchasePaymentTableProps) {
    const formatPaymentMethod = (method: string) => {
        const methods: Record<string, string> = {
            cash: 'Tunai',
            transfer: 'Transfer',
            giro: 'Giro',
            cek: 'Cek',
            other: 'Lainnya',
        };
        return methods[method] || method;
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No. Pembayaran</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jumlah Invoice</TableHead>
                        <TableHead className="text-right">
                            Total Pembayaran
                        </TableHead>
                        <TableHead>Metode</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="text-center text-muted-foreground"
                            >
                                Tidak ada data pembayaran pembelian
                            </TableCell>
                        </TableRow>
                    ) : (
                        payments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell className="font-medium">
                                    {payment.payment_number}
                                </TableCell>
                                <TableCell>
                                    {formatDatetoString(
                                        new Date(payment.payment_date),
                                    )}
                                </TableCell>
                                <TableCell>
                                    {payment.items?.length ||
                                        payment.purchases?.length ||
                                        0}{' '}
                                    invoice
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(payment.total_amount)}
                                </TableCell>
                                <TableCell>
                                    {formatPaymentMethod(
                                        payment.payment_method,
                                    )}
                                </TableCell>
                                <TableCell>
                                    {payment.bank?.name || '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge
                                        variant={
                                            payment.status === 'confirmed'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {payment.status === 'confirmed'
                                            ? 'Confirmed'
                                            : 'Pending'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => onView(payment)}
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
