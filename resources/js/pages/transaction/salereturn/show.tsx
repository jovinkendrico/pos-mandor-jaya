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
import { index } from '@/routes/sale-returns';
import { BreadcrumbItem, ISaleReturn } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    return: ISaleReturn;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Retur Jual',
        href: index().url,
    },
    {
        title: 'Detail',
        href: '#',
    },
];

export default function SaleReturnShow({ return: returnData }: PageProps) {
    const {
        isOpen: isConfirmModalOpen,
        openModal: openConfirmModal,
        closeModal: closeConfirmModal,
    } = useDisclosure();

    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
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
        ...(returnData.status === 'confirmed' ? ['Cost', 'Profit Adj.'] : []),
    ];

    const handleConfirm = () => {
        router.post(
            `/sale-returns/${returnData.id}/confirm`,
            {},
            {
                onSuccess: () => {
                    toast.success('Retur penjualan dikonfirmasi');
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
            `/sale-returns/${returnData.id}/unconfirm`,
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

    const handleDelete = () => {
        router.delete(`/sale-returns/${returnData.id}`, {
            onSuccess: () => {
                toast.success('Retur penjualan dihapus');
                closeDeleteModal();
            },
            onError: () => {
                toast.error('Gagal menghapus retur');
                closeDeleteModal();
            },
        });
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Retur Jual ${returnData.return_number}`} />

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex flex-row items-center gap-2">
                            <Link href={index().url}>
                                <ArrowLeft className="h-8 w-8" />
                            </Link>
                            <PageTitle
                                title={`Retur Jual ${returnData.return_number}`}
                            />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge
                                variant={
                                    returnData.status === 'confirmed'
                                        ? 'default'
                                        : 'secondary'
                                }
                                className={cn(
                                    returnData.status === 'pending'
                                        ? 'badge-yellow-light'
                                        : 'badge-green-light',
                                )}
                            >
                                {returnData.status === 'confirmed'
                                    ? 'Confirmed'
                                    : 'Pending'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {returnData.status === 'pending' && (
                            <>
                                <Button
                                    onClick={openDeleteModal}
                                    variant="destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                </Button>
                                <Button
                                    onClick={openConfirmModal}
                                    className="btn-primary"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Konfirmasi
                                </Button>
                            </>
                        )}
                        {returnData.status === 'confirmed' && (
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
                                    No. Penjualan:
                                </span>
                                <span className="font-mono font-medium">
                                    {returnData.sale.sale_number}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Customer:
                                </span>
                                <span className="font-medium">
                                    {returnData.sale.customer?.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Tanggal Retur:
                                </span>
                                <span className="font-medium">
                                    {formatDatetoString(
                                        new Date(returnData.return_date),
                                    )}
                                </span>
                            </div>
                            {returnData.reason && (
                                <div className="flex flex-col border-t pt-2">
                                    <span className="text-muted-foreground">
                                        Alasan:
                                    </span>
                                    <span className="mt-1 font-medium">
                                        {returnData.reason}
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
                                    {formatCurrency(returnData.subtotal)}
                                </span>
                            </div>
                            {formatNumber(returnData.discount1_amount ?? 0) >
                                0 && (
                                <div className="flex justify-between text-red-600 dark:text-danger-400">
                                    <span>Total Diskon 1:</span>
                                    <span>
                                        -
                                        {formatCurrency(
                                            returnData.discount1_amount ?? 0,
                                        )}
                                    </span>
                                </div>
                            )}
                            {formatNumber(returnData.discount2_amount ?? 0) >
                                0 && (
                                <div className="flex justify-between text-red-600 dark:text-danger-400">
                                    <span>Total Diskon 2:</span>
                                    <span>
                                        -
                                        {formatCurrency(
                                            returnData.discount2_amount ?? 0,
                                        )}
                                    </span>
                                </div>
                            )}
                            {formatNumber(returnData.ppn_amount ?? 0) > 0 && (
                                <div className="flex justify-between text-blue-600 dark:text-primary-700">
                                    <span>
                                        PPN ({returnData.ppn_percent}%):
                                    </span>
                                    <span>
                                        +
                                        {formatCurrency(
                                            returnData.ppn_amount ?? 0,
                                        )}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                <span>TOTAL:</span>
                                <span>
                                    {formatCurrency(returnData.total_amount)}
                                </span>
                            </div>
                            {returnData.status === 'confirmed' && (
                                <>
                                    <div className="flex justify-between border-t pt-2 text-red-600 dark:text-danger-500">
                                        <span>Total Cost:</span>
                                        <span className="font-medium">
                                            {formatCurrency(
                                                returnData.total_cost,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-green-600 dark:text-green-500">
                                        <span>PROFIT ADJ.:</span>
                                        <span>
                                            {formatCurrency(
                                                returnData.total_profit_adjustment,
                                            )}
                                        </span>
                                    </div>
                                </>
                            )}
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
                                tableRow={returnData.details}
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
                                            <Badge variant="outline">
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
                                        {returnData.status === 'confirmed' && (
                                            <>
                                                <TableCell className="flex w-full items-center justify-center text-center text-red-600 dark:text-danger-500">
                                                    {formatCurrency(
                                                        detail.cost || 0,
                                                    )}
                                                </TableCell>
                                                <TableCell className="flex w-full items-center justify-center text-center font-medium text-green-600 dark:text-green-500">
                                                    {formatCurrency(
                                                        detail.profit_adjustment ||
                                                            0,
                                                    )}
                                                </TableCell>
                                            </>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Modal
                    titleDesc={
                        returnData.status === 'pending'
                            ? 'Konfirmasi Retur Penjualan?'
                            : 'Batalkan Konfirmasi?'
                    }
                    contentDesc={
                        returnData.status === 'pending'
                            ? 'Stock akan bertambah, profit akan di-adjust, dan data tidak bisa diedit lagi.'
                            : 'Stock akan dikurangi kembali.'
                    }
                    submitText={
                        returnData.status === 'pending'
                            ? 'Konfirmasi'
                            : 'Batalkan Konfirmasi'
                    }
                    isModalOpen={isConfirmModalOpen}
                    onModalClose={closeConfirmModal}
                    handleSubmit={
                        returnData.status === 'pending'
                            ? handleConfirm
                            : handleUnconfirm
                    }
                />
                <Modal
                    titleDesc="Hapus Retur Penjualan?"
                    contentDesc="Apakah Anda yakin ingin menghapus data retur penjualan ini? Data yang dihapus tidak dapat dikembalikan."
                    submitText="Hapus"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    handleSubmit={handleDelete}
                />
            </AppLayout>
        </>
    );
}
