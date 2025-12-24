import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { PurchasePaymentStatus } from '@/constants/enum';
import AppLayout from '@/layouts/app-layout';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { index } from '@/routes/purchase-payments';
import { BreadcrumbItem, IPurchasePayment } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Pencil, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    purchase_payment: IPurchasePayment;
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

const PurchasePaymentShow = ({ purchase_payment }: PageProps) => {
    const tableColumn = [
        'Kode',
        'Supplier',
        'Tanggal Pembelian',
        'Total',
        'Jumlah Pembayaran',
    ];

    const handleEdit = () => {
        router.visit(`/purchase-payments/${purchase_payment.id}/edit`);
    };

    const handleConfirm = () => {
        router.post(
            `/purchase-payments/${purchase_payment.id}/confirm`,
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
            `/purchase-payments/${purchase_payment.id}/unconfirm`,
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
            <Head title={`Pembayaran ${purchase_payment.payment_number}`} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="flex flex-row items-center gap-2">
                        <Link href={index().url}>
                            <ArrowLeft className="h-8 w-8" />
                        </Link>
                        <PageTitle title="Tambah Pembayaran Pembelian" />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <Badge
                            className={cn(
                                purchase_payment.status ===
                                    PurchasePaymentStatus.PENDING
                                    ? 'badge-yellow-light'
                                    : 'badge-green-light',
                            )}
                        >
                            {purchase_payment.status ===
                            PurchasePaymentStatus.CONFIRMED
                                ? 'Confirmed'
                                : 'Pending'}
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    {purchase_payment.status ===
                        PurchasePaymentStatus.PENDING && (
                        <>
                            <Button
                                onClick={handleEdit}
                                variant="secondary"
                                className="btn-secondary"
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                className="btn-primary"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Konfirmasi
                            </Button>
                        </>
                    )}
                    {purchase_payment.status ===
                        PurchasePaymentStatus.CONFIRMED && (
                        <Button
                            onClick={handleUnconfirm}
                            className="btn-danger"
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Batalkan Konfirmasi
                        </Button>
                    )}
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="content">
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
                                    new Date(purchase_payment.payment_date),
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Metode:
                            </span>
                            <span className="font-medium">
                                {purchase_payment.payment_method}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Bank:</span>
                            <span className="font-medium">
                                {purchase_payment.bank?.name || '-'}
                            </span>
                        </div>
                        {purchase_payment.reference_number && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    No. Referensi:
                                </span>
                                <span className="font-medium">
                                    {purchase_payment.reference_number}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Total:
                            </span>
                            <span className="text-lg font-bold">
                                {formatCurrency(purchase_payment.total_amount)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Created By:
                            </span>
                            <span className="font-medium">
                                {purchase_payment.creator?.name || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Updated By:
                            </span>
                            <span className="font-medium">
                                {purchase_payment.updater?.name || '-'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {purchase_payment.notes && (
                    <Card className="content">
                        <CardHeader>
                            <CardTitle>Catatan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{purchase_payment.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card className="content">
                <CardHeader>
                    <CardTitle>Invoice Pembelian</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="input-box overflow-x-auto rounded-lg">
                        <TableLayout
                            tableColumn={tableColumn}
                            tableRow={purchase_payment.items}
                            pageFrom={1}
                            renderRow={(item) => (
                                <>
                                    <TableCell className="flex w-full items-center justify-center text-center font-mono">
                                        {item.purchase?.purchase_number || '-'}
                                    </TableCell>
                                    <TableCell className="flex w-full items-center justify-center text-center">
                                        {item.purchase?.supplier?.name || '-'}
                                    </TableCell>
                                    <TableCell className="flex w-full items-center justify-center text-center">
                                        {item.purchase?.purchase_date
                                            ? formatDatetoString(
                                                  new Date(
                                                      item.purchase.purchase_date,
                                                  ),
                                              )
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="flex w-full items-center justify-center text-center">
                                        {item.purchase?.total_amount
                                            ? formatCurrency(
                                                  item.purchase.total_amount,
                                              )
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="flex w-full items-center justify-center text-center">
                                        {formatCurrency(item.amount)}
                                    </TableCell>
                                </>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
};

export default PurchasePaymentShow;
