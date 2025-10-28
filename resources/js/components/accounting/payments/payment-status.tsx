import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { IPayment } from '@/types';
import { CreditCard, DollarSign, Calendar } from 'lucide-react';

interface PaymentStatusProps {
    totalAmount: number;
    totalPaid: number;
    remainingAmount: number;
    isFullyPaid: boolean;
    paymentPercentage: number;
    payments?: IPayment[];
    onAddPayment?: () => void;
}

export default function PaymentStatus({
    totalAmount,
    totalPaid,
    remainingAmount,
    isFullyPaid,
    paymentPercentage,
    payments = [],
    onAddPayment
}: PaymentStatusProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Status Pembayaran
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Payment Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Progress Pembayaran</span>
                        <span className="font-medium">{paymentPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={paymentPercentage} className="h-2" />
                </div>

                {/* Amount Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(totalAmount)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Tagihan</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalPaid)}
                        </div>
                        <div className="text-sm text-muted-foreground">Sudah Dibayar</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${
                            remainingAmount > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                            {formatCurrency(remainingAmount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {remainingAmount > 0 ? 'Sisa Tagihan' : 'Lunas'}
                        </div>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center">
                    <Badge 
                        variant={isFullyPaid ? 'default' : 'secondary'}
                        className={isFullyPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    >
                        {isFullyPaid ? 'Lunas' : 'Belum Lunas'}
                    </Badge>
                </div>

                {/* Payment History */}
                {payments.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-medium">Riwayat Pembayaran</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {payments.map((payment) => (
                                <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {new Date(payment.payment_date).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-600" />
                                        <span className="font-medium text-green-600">
                                            {formatCurrency(payment.amount_paid)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add Payment Button */}
                {!isFullyPaid && onAddPayment && (
                    <div className="flex justify-center pt-4">
                        <Button onClick={onAddPayment} className="btn-primary">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Tambah Pembayaran
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
