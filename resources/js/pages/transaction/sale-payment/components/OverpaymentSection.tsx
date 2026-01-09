import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { IBank, IOverpaymentTransaction, ISalePayment } from '@/types';
import { router } from '@inertiajs/react';
import { ArrowLeftRight, Ban, CheckCircle2, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface OverpaymentSectionProps {
    salePayment: ISalePayment;
    banks: IBank[];
}

export default function OverpaymentSection({
    salePayment,
    banks,
}: OverpaymentSectionProps) {
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [refundData, setRefundData] = useState({
        transaction_date: new Date().toISOString().split('T')[0],
        bank_id: salePayment.bank_id || '',
        notes: '',
    });
    const [convertData, setConvertData] = useState({
        transaction_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const hasOverpayment =
        salePayment.overpayment_amount > 0 &&
        salePayment.overpayment_status !== 'none';

    if (!hasOverpayment) {
        return null;
    }

    const handleRefund = () => {
        router.post(
            `/sale-payments/${salePayment.id}/overpayment/refund`,
            refundData,
            {
                onSuccess: () => {
                    toast.success('Kelebihan pembayaran berhasil dikembalikan');
                    setShowRefundModal(false);
                },
                onError: (errors) => {
                    toast.error(
                        errors.message ||
                        'Gagal mengembalikan kelebihan pembayaran',
                    );
                },
            },
        );
    };

    const handleConvert = () => {
        router.post(
            `/sale-payments/${salePayment.id}/overpayment/convert-to-income`,
            convertData,
            {
                onSuccess: () => {
                    toast.success(
                        'Kelebihan pembayaran berhasil dikonversi menjadi pendapatan',
                    );
                    setShowConvertModal(false);
                },
                onError: (errors) => {
                    toast.error(
                        errors.message ||
                        'Gagal mengkonversi kelebihan pembayaran',
                    );
                },
            },
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <Badge className="badge-yellow-light">
                        Menunggu Tindakan
                    </Badge>
                );
            case 'refunded':
                return (
                    <Badge className="badge-green-light">Dikembalikan</Badge>
                );
            case 'converted_to_income':
                return (
                    <Badge className="badge-blue-light">
                        Dikonversi ke Pendapatan
                    </Badge>
                );
            default:
                return null;
        }
    };

    const getTransactionTypeBadge = (type: string) => {
        return type === 'refund' ? (
            <Badge className="badge-green-light">Pengembalian</Badge>
        ) : (
            <Badge className="badge-blue-light">Konversi ke Pendapatan</Badge>
        );
    };

    return (
        <>
            <Card className="content border-orange-200 bg-orange-50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-orange-600" />
                            Kelebihan Pembayaran
                        </CardTitle>
                        {getStatusBadge(salePayment.overpayment_status)}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            Jumlah Kelebihan:
                        </span>
                        <span className="text-lg font-bold text-orange-600">
                            {formatCurrency(salePayment.overpayment_amount)}
                        </span>
                    </div>

                    {salePayment.overpayment_status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={() => setShowRefundModal(true)}
                                variant="outline"
                                className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                            >
                                <ArrowLeftRight className="mr-2 h-4 w-4" />
                                Kembalikan ke Pelanggan
                            </Button>
                            <Button
                                onClick={() => setShowConvertModal(true)}
                                variant="outline"
                                className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Jadikan Pendapatan
                            </Button>
                        </div>
                    )}

                    {salePayment.overpayment_transactions &&
                        salePayment.overpayment_transactions.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <h4 className="font-semibold">
                                    Riwayat Transaksi:
                                </h4>
                                {salePayment.overpayment_transactions.map(
                                    (transaction: IOverpaymentTransaction) => (
                                        <div
                                            key={transaction.id}
                                            className="rounded-lg border bg-white p-3"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm font-medium">
                                                            {
                                                                transaction.transaction_number
                                                            }
                                                        </span>
                                                        {getTransactionTypeBadge(
                                                            transaction.transaction_type,
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDatetoString(
                                                            new Date(
                                                                transaction.transaction_date,
                                                            ),
                                                        )}
                                                        {transaction.bank &&
                                                            ` • ${transaction.bank.name}`}
                                                    </p>
                                                    {transaction.notes && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {transaction.notes}
                                                        </p>
                                                    )}
                                                    {transaction.creator && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Oleh:{' '}
                                                            {
                                                                transaction
                                                                    .creator.name
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="font-semibold">
                                                    {formatCurrency(
                                                        transaction.amount,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                </CardContent>
            </Card>

            {/* Refund Modal */}
            <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Kembalikan Kelebihan Pembayaran
                        </DialogTitle>
                        <DialogDescription>
                            Kelebihan pembayaran akan dikembalikan ke pelanggan
                            melalui bank yang dipilih.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Jumlah</Label>
                            <Input
                                value={formatCurrency(
                                    salePayment.overpayment_amount,
                                )}
                                disabled
                                className="font-semibold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="refund_date">
                                Tanggal Pengembalian
                            </Label>
                            <Input
                                id="refund_date"
                                type="date"
                                value={refundData.transaction_date}
                                onChange={(e) =>
                                    setRefundData({
                                        ...refundData,
                                        transaction_date: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="refund_bank">Bank</Label>
                            <select
                                id="refund_bank"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={refundData.bank_id}
                                onChange={(e) =>
                                    setRefundData({
                                        ...refundData,
                                        bank_id: e.target.value,
                                    })
                                }
                            >
                                <option value="">Pilih Bank</option>
                                {banks.map((bank) => (
                                    <option key={bank.id} value={bank.id}>
                                        {bank.name} - {bank.type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="refund_notes">Catatan</Label>
                            <Textarea
                                id="refund_notes"
                                value={refundData.notes}
                                onChange={(e) =>
                                    setRefundData({
                                        ...refundData,
                                        notes: e.target.value,
                                    })
                                }
                                placeholder="Catatan tambahan (opsional)"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRefundModal(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleRefund} className="btn-primary">
                            Kembalikan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Convert to Income Modal */}
            <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Konversi ke Pendapatan Lain-lain
                        </DialogTitle>
                        <DialogDescription>
                            Kelebihan pembayaran akan dicatat sebagai pendapatan
                            lain-lain perusahaan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Jumlah</Label>
                            <Input
                                value={formatCurrency(
                                    salePayment.overpayment_amount,
                                )}
                                disabled
                                className="font-semibold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="convert_date">
                                Tanggal Konversi
                            </Label>
                            <Input
                                id="convert_date"
                                type="date"
                                value={convertData.transaction_date}
                                onChange={(e) =>
                                    setConvertData({
                                        ...convertData,
                                        transaction_date: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="convert_notes">Catatan</Label>
                            <Textarea
                                id="convert_notes"
                                value={convertData.notes}
                                onChange={(e) =>
                                    setConvertData({
                                        ...convertData,
                                        notes: e.target.value,
                                    })
                                }
                                placeholder="Catatan tambahan (opsional)"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConvertModal(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleConvert} className="btn-primary">
                            Konversi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
