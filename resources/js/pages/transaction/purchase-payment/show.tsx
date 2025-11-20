import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { BreadcrumbItem, PurchasePayment } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Pencil, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    payment: PurchasePayment;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Pembayaran Pembelian',
        href: '/purchase-payments',
    },
    {
        title: 'Detail',
        href: '#',
    },
];

export default function PurchasePaymentShow({ payment }: PageProps) {
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

    const handleEdit = () => {
        router.visit(`/purchase-payments/${payment.id}/edit`);
    };

    const handleConfirm = () => {
        router.post(
            `/purchase-payments/${payment.id}/confirm`,
            {},
            {
                onSuccess: () => {
                    toast.success('Pembayaran berhasil dikonfirmasi');
                },
                onError: () => {
                    toast.error('Gagal mengonfirmasi pembayaran');
                },
            },
        );
    };

    const handleUnconfirm = () => {
        router.post(
            `/purchase-payments/${payment.id}/unconfirm`,
            {},
            {
                onSuccess: () => {
                    toast.success('Konfirmasi pembayaran dibatalkan');
                },
                onError: () => {
                    toast.error('Gagal membatalkan konfirmasi');
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Pembayaran ${payment.payment_number}`} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <PageTitle title={`Pembayaran ${payment.payment_number}`} />
                    <div className="mt-2 flex items-center gap-2">
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
                    </div>
                </div>
                <div className="flex gap-2">
                    {payment.status === 'pending' && (
                        <>
                            <Button onClick={handleEdit} variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button onClick={handleConfirm}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Konfirmasi
                            </Button>
                        </>
                    )}
                    {payment.status === 'confirmed' && (
                        <Button onClick={handleUnconfirm} variant="destructive">
                            <XCircle className="mr-2 h-4 w-4" />
                            Batalkan Konfirmasi
                        </Button>
                    )}
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Tanggal:
                            </span>
                            <span className="font-medium">
                                {formatDatetoString(
                                    new Date(payment.payment_date),
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Metode:
                            </span>
                            <span className="font-medium">
                                {formatPaymentMethod(payment.payment_method)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Bank:</span>
                            <span className="font-medium">
                                {payment.bank?.name || '-'}
                            </span>
                        </div>
                        {payment.reference_number && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    No. Referensi:
                                </span>
                                <span className="font-medium">
                                    {payment.reference_number}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Total:
                            </span>
                            <span className="text-lg font-bold">
                                {formatCurrency(payment.total_amount)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {payment.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Catatan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{payment.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice Pembelian</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Invoice</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead className="text-right">
                                        Total Invoice
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Jumlah Pembayaran
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payment.items && payment.items.length > 0 ? (
                                    payment.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.purchase
                                                    ?.purchase_number || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {item.purchase?.supplier
                                                    ?.name || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {item.purchase?.purchase_date
                                                    ? formatDatetoString(
                                                          new Date(
                                                              item.purchase.purchase_date,
                                                          ),
                                                      )
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.purchase?.total_amount
                                                    ? formatCurrency(
                                                          item.purchase
                                                              .total_amount,
                                                      )
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(item.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center text-muted-foreground"
                                        >
                                            Tidak ada invoice
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
