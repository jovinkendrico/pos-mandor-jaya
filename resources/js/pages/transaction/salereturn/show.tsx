import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import DotMatrixPrintButton from '@/components/DotMatrixPrintButton';
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
    formatNumberWithSeparator,
} from '@/lib/utils';
import { index } from '@/routes/sale-returns';
import { BreadcrumbItem, ISaleReturn } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    saleReturn: ISaleReturn & { allocations?: any[] };
    allocatedSales?: Record<number, any>;
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

export default function SaleReturnShow({ saleReturn, allocatedSales = {} }: PageProps) {
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
        ...(saleReturn.status === 'confirmed' ? ['Cost', 'Profit Adj.'] : []),
    ];

    const handleConfirm = () => {
        router.post(
            `/sale-returns/${saleReturn.id}/confirm`,
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
            `/sale-returns/${saleReturn.id}/unconfirm`,
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
        router.delete(`/sale-returns/${saleReturn.id}`, {
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
                <Head title={`Retur Jual ${saleReturn.return_number}`} />

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex flex-row items-center gap-2">
                            <Link href={index().url}>
                                <ArrowLeft className="h-8 w-8" />
                            </Link>
                            <PageTitle
                                title={`Retur Jual ${saleReturn.return_number}`}
                            />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge
                                variant={
                                    saleReturn.status === 'confirmed'
                                        ? 'default'
                                        : 'secondary'
                                }
                                className={cn(
                                    saleReturn.status === 'pending'
                                        ? 'badge-yellow-light'
                                        : 'badge-green-light',
                                )}
                            >
                                {saleReturn.status === 'confirmed'
                                    ? 'Confirmed'
                                    : 'Pending'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <DotMatrixPrintButton
                            data={{
                                sale_number: saleReturn.return_number,
                                date: (() => {
                                    const d = new Date(saleReturn.return_date);
                                    const day = String(d.getDate()).padStart(2, '0');
                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                    const year = d.getFullYear();
                                    return `${day}-${month}-${year}`;
                                })(),
                                customer_name: saleReturn.sale.customer?.name,
                                customer_city: saleReturn.sale.customer?.city?.name,
                                customer_phone: saleReturn.sale.customer?.phone_number,
                                total: saleReturn.total_amount,
                                details: saleReturn.details.map((d: any) => ({
                                    item_name: d.item?.name || '?',
                                    uom: d.item_uom?.uom.name || '',
                                    quantity: Number(d.quantity),
                                    price: Number(d.price),
                                    subtotal: Number(d.subtotal)
                                }))
                            }}
                        />
                        {saleReturn.status === 'pending' && (
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
                        {saleReturn.status === 'confirmed' && (
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
                                    {saleReturn.sale.sale_number}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Customer:
                                </span>
                                <span className="font-medium">
                                    {saleReturn.sale.customer?.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Tanggal Retur:
                                </span>
                                <span className="font-medium">
                                    {formatDatetoString(
                                        new Date(saleReturn.return_date),
                                    )}
                                </span>
                            </div>
                            {saleReturn.reason && (
                                <div className="flex flex-col border-t pt-2">
                                    <span className="text-muted-foreground">
                                        Alasan:
                                    </span>
                                    <span className="mt-1 font-medium">
                                        {saleReturn.reason}
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
                                    {formatCurrency(saleReturn.subtotal)}
                                </span>
                            </div>
                            {formatNumber(saleReturn.discount1_amount ?? 0) >
                                0 && (
                                    <div className="flex justify-between text-red-600 dark:text-danger-400">
                                        <span>Total Diskon 1:</span>
                                        <span>
                                            -
                                            {formatCurrency(
                                                saleReturn.discount1_amount ?? 0,
                                            )}
                                        </span>
                                    </div>
                                )}
                            {formatNumber(saleReturn.discount2_amount ?? 0) >
                                0 && (
                                    <div className="flex justify-between text-red-600 dark:text-danger-400">
                                        <span>Total Diskon 2:</span>
                                        <span>
                                            -
                                            {formatCurrency(
                                                saleReturn.discount2_amount ?? 0,
                                            )}
                                        </span>
                                    </div>
                                )}
                            {formatNumber(saleReturn.ppn_amount ?? 0) > 0 && (
                                <div className="flex justify-between text-blue-600 dark:text-primary-700">
                                    <span>
                                        PPN ({saleReturn.ppn_percent}%):
                                    </span>
                                    <span>
                                        +
                                        {formatCurrency(
                                            saleReturn.ppn_amount ?? 0,
                                        )}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                <span>TOTAL:</span>
                                <span>
                                    {formatCurrency(saleReturn.total_amount)}
                                </span>
                            </div>
                            {saleReturn.status === 'confirmed' && (
                                <>
                                    <div className="flex justify-between border-t pt-2 text-red-600 dark:text-danger-500">
                                        <span>Total Cost:</span>
                                        <span className="font-medium">
                                            {formatCurrency(
                                                saleReturn.total_cost,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-green-600 dark:text-emerald-500">
                                        <span>PROFIT ADJ.:</span>
                                        <span>
                                            {formatCurrency(
                                                saleReturn.total_profit_adjustment,
                                            )}
                                        </span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Allocations Table (if Potong Bon) */}
                {saleReturn.refund_method === 'reduce_receivable' && saleReturn.allocations && saleReturn.allocations.length > 0 && (
                    <Card className="content mb-6">
                        <CardHeader>
                            <CardTitle>Alokasi Potong Piutang (Potong Bon)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="input-box overflow-x-auto rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">No. Penjualan</th>
                                            <th className="px-4 py-2 text-left">Tanggal</th>
                                            <th className="px-4 py-2 text-right">Jumlah Potong</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {saleReturn.allocations.map((allocation: any, index: number) => {
                                            const sale = allocatedSales[allocation.sale_id];
                                            return (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 font-mono">
                                                        {sale?.sale_number || `ID: ${allocation.sale_id}`}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {sale?.sale_date ? new Date(sale.sale_date).toLocaleDateString('id-ID') : '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-medium">
                                                        {formatCurrency(allocation.amount)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-muted/30 font-bold">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-2 text-right border-t">TOTAL ALOKASI:</td>
                                            <td className="px-4 py-2 text-right border-t text-primary">
                                                {formatCurrency(saleReturn.allocations.reduce((sum: number, a: any) => sum + Number(a.amount), 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Items Table */}
                <Card className="content">
                    <CardHeader>
                        <CardTitle>Detail Barang Diretur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <TableLayout
                                tableColumn={tableColumn}
                                tableRow={saleReturn.details}
                                pageFrom={1}
                                renderRow={(detail: any) => (
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
                                            {formatNumberWithSeparator(
                                                detail.quantity,
                                            )}
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
                                        {saleReturn.status === 'confirmed' && (
                                            <>
                                                <TableCell className="flex w-full items-center justify-center text-center text-red-600 dark:text-danger-500">
                                                    {formatCurrency(
                                                        detail.cost || 0,
                                                    )}
                                                </TableCell>
                                                <TableCell className="flex w-full items-center justify-center text-center font-medium text-green-600 dark:text-emerald-500">
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
                        saleReturn.status === 'pending'
                            ? 'Konfirmasi Retur Penjualan?'
                            : 'Batalkan Konfirmasi?'
                    }
                    contentDesc={
                        saleReturn.status === 'pending'
                            ? 'Stock akan bertambah, profit akan di-adjust, dan data tidak bisa diedit lagi.'
                            : 'Stock akan dikurangi kembali.'
                    }
                    submitText={
                        saleReturn.status === 'pending'
                            ? 'Konfirmasi'
                            : 'Batalkan Konfirmasi'
                    }
                    isModalOpen={isConfirmModalOpen}
                    onModalClose={closeConfirmModal}
                    handleSubmit={
                        saleReturn.status === 'pending'
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
