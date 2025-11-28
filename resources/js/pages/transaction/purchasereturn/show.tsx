import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Modal from '@/components/ui/Modal/Modal';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import {
    cn,
    formatCurrency,
    formatDatetoString,
    formatNumber,
} from '@/lib/utils';
import { index } from '@/routes/purchase-returns';
import { BreadcrumbItem, IPurchaseReturn } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    purchase_return: IPurchaseReturn;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Retur Beli',
        href: index().url,
    },
    {
        title: 'Detail',
        href: '#',
    },
];

const PurchaseReturnShow = (props: PageProps) => {
    const { purchase_return } = props;

    const {
        isOpen: isConfirmModalOpen,
        openModal: openConfirmModal,
        closeModal: closeConfirmModal,
    } = useDisclosure();

    const tableColumn = [
        'Kode',
        'Nama Item',
        'UOM',
        'Kuantitas',
        'Harga',
        'Disc 1 (%)',
        'Disc 2 (%)',
        'Subtotal',
    ];

    const handleConfirm = () => {
        router.post(
            `/purchase-returns/${purchase_return.id}/confirm`,
            {},
            {
                onSuccess: () => {
                    toast.success('Retur pembelian dikonfirmasi');
                    closeConfirmModal();
                },
                onError: () => {
                    toast.error('Gagal konfirmasi retur');
                    closeConfirmModal();
                },
            },
        );
    };

    const handleUnconfirm = () => {
        router.post(
            `/purchase-returns/${purchase_return.id}/unconfirm`,
            {},
            {
                onSuccess: () => {
                    toast.success('Konfirmasi dibatalkan');
                    closeConfirmModal();
                },
                onError: () => {
                    toast.error('Gagal membatalkan konfirmasi');
                    closeConfirmModal();
                },
            },
        );
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Retur Beli ${purchase_return.return_number}`} />

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex flex-row items-center gap-2">
                            <Link href={index().url}>
                                <ArrowLeft className="h-8 w-8" />
                            </Link>
                            <PageTitle
                                title={`Retur Beli ${purchase_return.return_number}`}
                            />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge
                                variant={
                                    purchase_return.status === 'confirmed'
                                        ? 'default'
                                        : 'secondary'
                                }
                                className={cn(
                                    purchase_return.status === 'pending'
                                        ? 'badge-yellow-light'
                                        : 'badge-green-light',
                                )}
                            >
                                {purchase_return.status === 'confirmed'
                                    ? 'Confirmed'
                                    : 'Pending'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {purchase_return.status === 'pending' && (
                            <>
                                <Button
                                    onClick={openConfirmModal}
                                    className="btn-primary"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Konfirmasi
                                </Button>
                            </>
                        )}
                        {purchase_return.status === 'confirmed' && (
                            <Button
                                onClick={openConfirmModal}
                                className="btn-danger"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Batalkan Konfirmasi
                            </Button>
                        )}
                    </div>
                </div>

                {/* Return Info */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card className="content">
                        <CardHeader>
                            <CardTitle>Informasi Retur</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    No. Pembelian:
                                </span>
                                <span className="font-mono font-medium">
                                    {purchase_return.purchase.purchase_number}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Supplier:
                                </span>
                                <span className="font-medium">
                                    {purchase_return.purchase.supplier?.name ||
                                        '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Tanggal Retur:
                                </span>
                                <span className="font-medium">
                                    {formatDatetoString(
                                        new Date(purchase_return.return_date),
                                    )}
                                </span>
                            </div>
                            {purchase_return.reason && (
                                <div className="flex flex-col border-t pt-2">
                                    <span className="text-muted-foreground">
                                        Alasan:
                                    </span>
                                    <span className="mt-1 font-medium">
                                        {purchase_return.reason}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="content">
                        <CardHeader>
                            <CardTitle>Ringkasan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Subtotal:
                                </span>
                                <span>
                                    {formatCurrency(purchase_return.subtotal)}
                                </span>
                            </div>
                            {formatNumber(
                                purchase_return.discount1_amount ?? 0,
                            ) > 0 && (
                                <div className="flex justify-between text-red-600 dark:text-danger-400">
                                    <span>Total Diskon 1:</span>
                                    <span>
                                        -
                                        {formatCurrency(
                                            purchase_return.discount1_amount ??
                                                0,
                                        )}
                                    </span>
                                </div>
                            )}
                            {formatNumber(
                                purchase_return.discount2_amount ?? 0,
                            ) > 0 && (
                                <div className="flex justify-between text-red-600 dark:text-danger-400">
                                    <span>Total Diskon 2:</span>
                                    <span>
                                        -
                                        {formatCurrency(
                                            purchase_return.discount2_amount ??
                                                0,
                                        )}
                                    </span>
                                </div>
                            )}
                            {formatNumber(purchase_return.ppn_amount ?? 0) >
                                0 && (
                                <div className="flex justify-between text-blue-600 dark:text-primary-700">
                                    <span>
                                        PPN ({purchase_return.ppn_percent}%):
                                    </span>
                                    <span>
                                        +
                                        {formatCurrency(
                                            purchase_return.ppn_amount ?? 0,
                                        )}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                <span>TOTAL:</span>
                                <span>
                                    {formatCurrency(
                                        purchase_return.total_amount,
                                    )}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Items Table */}
                <Card className="content">
                    <CardHeader>
                        <CardTitle>Detail Barang Diretur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <TableLayout
                                tableColumn={tableColumn}
                                tableRow={purchase_return.details}
                                pageFrom={1}
                                renderRow={(detail) => (
                                    <>
                                        <TableCell className="flex w-full items-center justify-center text-center font-mono">
                                            {detail.item?.code}
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center">
                                            {detail.item?.name}
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center">
                                            <Badge className="badge-blue-light">
                                                {detail.item_uom?.uom.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center">
                                            {formatNumber(
                                                detail.quantity,
                                            ).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center">
                                            {formatCurrency(detail.price)}
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center text-red-600 dark:text-danger-400">
                                            {formatNumber(
                                                detail.discount1_percent ?? 0,
                                            ) > 0
                                                ? `${detail.discount1_percent}%`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center text-red-600 dark:text-danger-400">
                                            {formatNumber(
                                                detail.discount2_percent ?? 0,
                                            ) > 0
                                                ? `${detail.discount2_percent}%`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center">
                                            {formatCurrency(detail.subtotal)}
                                        </TableCell>
                                    </>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Modal
                    titleDesc={
                        purchase_return.status === 'pending'
                            ? 'Konfirmasi Retur Pembelian?'
                            : 'Batalkan Konfirmasi?'
                    }
                    contentDesc={
                        purchase_return.status === 'pending'
                            ? 'Stock akan berkurang dan data tidak bisa diedit lagi.'
                            : 'Stock akan dikembalikan.'
                    }
                    submitText={
                        purchase_return.status === 'pending'
                            ? 'Konfirmasi'
                            : 'Batalkan Konfirmasi'
                    }
                    isModalOpen={isConfirmModalOpen}
                    onModalClose={closeConfirmModal}
                    handleSubmit={
                        purchase_return.status === 'pending'
                            ? handleConfirm
                            : handleUnconfirm
                    }
                />
            </AppLayout>
        </>
    );
};

export default PurchaseReturnShow;
