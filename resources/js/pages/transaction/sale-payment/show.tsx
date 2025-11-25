import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { SalePaymentStatus } from '@/constants/enum';
import AppLayout from '@/layouts/app-layout';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { index } from '@/routes/sale-payments';
import { BreadcrumbItem, ISalePayment } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Pencil, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    sale_payment: ISalePayment;
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

const SalePaymentShow = (props: PageProps) => {
    const { sale_payment } = props;

    const tableColumn = [
        'Kode',
        'Customer',
        'Tanggal Penjualan',
        'Total',
        'Jumlah Pembayaran',
    ];

    const handleEdit = () => {
        router.visit(`/sale-payments/${sale_payment.id}/edit`);
    };

    const handleConfirm = () => {
        router.post(
            `/sale-payments/${sale_payment.id}/confirm`,
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
            `/sale-payments/${sale_payment.id}/unconfirm`,
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
            <Head title={`Pembayaran ${sale_payment.payment_number}`} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="flex flex-row items-center gap-2">
                        <Link href={index().url}>
                            <ArrowLeft className="h-8 w-8" />
                        </Link>
                        <PageTitle title="Detail Pembayaran Penjualan" />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <Badge
                            className={cn(
                                sale_payment.status ===
                                    SalePaymentStatus.PENDING
                                    ? 'badge-yellow-light'
                                    : 'badge-green-light',
                            )}
                        >
                            {sale_payment.status === SalePaymentStatus.CONFIRMED
                                ? 'Confirmed'
                                : 'Pending'}
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    {sale_payment.status === SalePaymentStatus.PENDING && (
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
                    {sale_payment.status === SalePaymentStatus.CONFIRMED && (
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
                                    new Date(sale_payment.payment_date),
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Metode:
                            </span>
                            <span className="font-medium">
                                {sale_payment.payment_method}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Bank:</span>
                            <span className="font-medium">
                                {sale_payment.bank?.name || '-'}
                            </span>
                        </div>
                        {sale_payment.reference_number && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    No. Referensi:
                                </span>
                                <span className="font-medium">
                                    {sale_payment.reference_number}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Total:
                            </span>
                            <span className="text-lg font-bold">
                                {formatCurrency(sale_payment.total_amount)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {sale_payment.notes && (
                    <Card className="content">
                        <CardHeader>
                            <CardTitle>Catatan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{sale_payment.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card className="content">
                <CardHeader>
                    <CardTitle>Invoice Penjualan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="input-box overflow-x-auto rounded-lg">
                        <TableLayout
                            tableColumn={tableColumn}
                            tableRow={sale_payment.items || []}
                            pageFrom={1}
                            renderRow={(item) => (
                                <>
                                    <TableCell className="flex w-full items-center justify-center text-center font-mono">
                                        {item.sale?.sale_number || '-'}
                                    </TableCell>
                                    <TableCell className="flex w-full items-center justify-center text-center">
                                        {item.sale?.customer?.name || '-'}
                                    </TableCell>
                                    <TableCell className="flex w-full items-center justify-center text-center">
                                        {item.sale?.sale_date
                                            ? formatDatetoString(
                                                  new Date(item.sale.sale_date),
                                              )
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="flex w-full items-center justify-center text-center">
                                        {item.sale?.total_amount
                                            ? formatCurrency(
                                                  item.sale.total_amount,
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

export default SalePaymentShow;
