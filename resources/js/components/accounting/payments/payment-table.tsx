import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IPayment } from '@/types';
import { Edit, Trash2 } from 'lucide-react';

interface PaymentTableProps {
    payments: IPayment[];
    onEdit: (payment: IPayment) => void;
    onDelete: (payment: IPayment) => void;
}

export default function PaymentTable({ payments, onEdit, onDelete }: PaymentTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const getPaymentMethodLabel = (method: string) => {
        const methods = {
            cash: 'Cash',
            bank_transfer: 'Bank Transfer',
            check: 'Check',
            other: 'Other'
        };
        return methods[method as keyof typeof methods] || method;
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No. Pembayaran</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Transaksi</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Metode</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map((payment) => (
                        <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                                {payment.payment_number}
                            </TableCell>
                            <TableCell>
                                <Badge variant={payment.reference_type === 'Sale' ? 'default' : 'secondary'}>
                                    {payment.reference_type}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {payment.reference?.purchase_number || payment.reference?.sale_number || `#${payment.reference_id}`}
                            </TableCell>
                            <TableCell>
                                {new Date(payment.payment_date).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell className="font-medium">
                                {formatCurrency(payment.amount_paid)}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    {getPaymentMethodLabel(payment.payment_method)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {payment.bank?.name || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(payment)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDelete(payment)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
