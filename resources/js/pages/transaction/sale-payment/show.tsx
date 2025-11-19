import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { BreadcrumbItem, SalePayment } from '@/types';
import { Head, router } from '@inertiajs/react';
import { formatCurrency } from '@/lib/utils';
import { Pencil, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    payment: SalePayment;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Pembayaran Penjualan',
        href: '/sale-payments',
    },
    {
        title: 'Detail',
        href: '#',
    },
];

export default function SalePaymentShow({ payment }: PageProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

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
        router.visit(`/sale-payments/${payment.id}/edit`);
    };

    const handleConfirm = () => {
        router.post(`/sale-payments/${payment.id}/confirm`, {}, {
            onSuccess: () => {
                toast.success('Pembayaran berhasil dikonfirmasi');
            },
            onError: () => {
                toast.error('Gagal mengonfirmasi pembayaran');
            },
        });
    };

    const handleUnconfirm = () => {
        router.post(`/sale-payments/${payment.id}/unconfirm`, {}, {
            onSuccess: () => {
                toast.success('Konfirmasi pembayaran dibatalkan');
            },
            onError: () => {
                toast.error('Gagal membatalkan konfirmasi');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Pembayaran ${payment.payment_number}`} />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <PageTitle title={`Pembayaran ${payment.payment_number}`} />
                    <div className="flex gap-2 items-center mt-2">
                        <Badge variant={payment.status === 'confirmed' ? 'default' : 'secondary'}>
                            {payment.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    {payment.status === 'pending' && (
                        <>
                            <Button onClick={handleEdit} variant="outline">
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button onClick={handleConfirm}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Konfirmasi
                            </Button>
                        </>
                    )}
                    {payment.status === 'confirmed' && (
                        <Button onClick={handleUnconfirm} variant="destructive">
                            <XCircle className="h-4 w-4 mr-2" />
                            Batalkan Konfirmasi
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tanggal:</span>
                            <span className="font-medium">{formatDate(payment.payment_date)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Metode:</span>
                            <span className="font-medium">{formatPaymentMethod(payment.payment_method)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Bank:</span>
                            <span className="font-medium">{payment.bank?.name || '-'}</span>
                        </div>
                        {payment.reference_number && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">No. Referensi:</span>
                                <span className="font-medium">{payment.reference_number}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-bold text-lg">{formatCurrency(payment.total_amount)}</span>
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
                    <CardTitle>Invoice Penjualan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Invoice</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead className="text-right">Total Invoice</TableHead>
                                    <TableHead className="text-right">Jumlah Pembayaran</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payment.items && payment.items.length > 0 ? (
                                    payment.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.sale?.sale_number || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {item.sale?.customer?.name || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {item.sale?.sale_date
                                                    ? formatDate(item.sale.sale_date)
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.sale?.total_amount
                                                    ? formatCurrency(item.sale.total_amount)
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(item.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
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

