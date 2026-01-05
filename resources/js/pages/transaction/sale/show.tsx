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
import { edit, index, print } from '@/routes/sales';
import { BreadcrumbItem, ISale } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Download,
    Pencil,
    Printer,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { printRaw } from '@/lib/qz-service';

interface PageProps {
    sale: ISale;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Penjualan',
        href: index().url,
    },
    {
        title: 'Detail',
        href: '#',
    },
];

const SaleShow = (props: PageProps) => {
    const { sale } = props;

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
        'Cost',
        'Profit',
    ];

    if (sale.status === 'pending') {
        tableColumn.pop();
        tableColumn.pop();
    }

    const handleConfirm = () => {
        router.post(
            `/sales/${sale.id}/confirm`,
            {},
            {
                onSuccess: () => {
                    toast.success('Penjualan dikonfirmasi');
                    closeConfirmModal();
                },
                onError: (errors: Record<string, string>) => {
                    const message = errors.msg || 'Gagal konfirmasi penjualan';
                    closeConfirmModal();
                    toast.error(message);
                },
            },
        );
    };

    const handleUnconfirm = () => {
        router.post(
            `/sales/${sale.id}/unconfirm`,
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

    const handleEdit = () => {
        router.visit(edit(sale.id).url);
    };

    const handleRawPrint = () => {
        window.location.href = `/sales/${sale.id}/raw`;
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Penjualan ${sale.sale_number}`} />

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex flex-row items-center gap-2">
                            <Link href={index().url}>
                                <ArrowLeft className="h-8 w-8" />
                            </Link>
                            <PageTitle
                                title={`Penjualan ${sale.sale_number}`}
                            />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge
                                variant={
                                    sale.status === 'confirmed'
                                        ? 'default'
                                        : 'secondary'
                                }
                                className={cn(
                                    sale.status === 'pending'
                                        ? 'badge-yellow-light'
                                        : 'badge-green-light',
                                )}
                            >
                                {sale.status === 'confirmed'
                                    ? 'Confirmed'
                                    : 'Pending'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {sale.status === 'pending' && (
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
                                    onClick={openConfirmModal}
                                    className="btn-primary"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Konfirmasi
                                </Button>
                            </>
                        )}
                        {sale.status === 'confirmed' && (
                            <Button
                                onClick={openConfirmModal}
                                variant="destructive"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Batalkan Konfirmasi
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex w-full justify-end gap-2">
                    <Button
                        variant="outline"
                        className="btn-secondary"
                        onClick={handleRawPrint}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Download RAW (.txt)
                    </Button>
                    <Button
                        className="btn-primary"
                        onClick={() => {
                            window.location.href = print(sale.id).url;
                        }}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download Invoice (PDF)
                    </Button>
                </div>

                {/* Sale Info */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card className="content">
                        <CardHeader>
                            <CardTitle>Informasi Penjualan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Customer:
                                </span>
                                <span className="font-medium">
                                    {sale.customer?.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Tanggal:
                                </span>
                                <span className="font-medium">
                                    {formatDatetoString(
                                        new Date(sale.sale_date),
                                    )}
                                </span>
                            </div>
                            {sale.due_date && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Jatuh Tempo:
                                    </span>
                                    <span className="font-medium">
                                        {formatDatetoString(
                                            new Date(sale.due_date),
                                        )}
                                    </span>
                                </div>
                            )}
                            {sale.notes && (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">
                                        Catatan:
                                    </span>
                                    <span className="mt-1 font-medium">
                                        {sale.notes}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Created By:
                                </span>
                                <span className="font-medium">
                                    {sale.creator?.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Updated By:
                                </span>
                                <span className="font-medium">
                                    {sale.updater?.name || '-'}
                                </span>
                            </div>
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
                                    {formatCurrency(sale.subtotal ?? 0)}
                                </span>
                            </div>
                            {formatNumber(sale.discount1_percent ?? 0) > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>
                                        Diskon 1 ({sale.discount1_percent}%):
                                    </span>
                                    <span>
                                        -
                                        {formatCurrency(
                                            sale.discount1_amount ?? 0,
                                        )}
                                    </span>
                                </div>
                            )}
                            {formatNumber(sale.discount2_percent ?? 0) > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>
                                        Diskon 2 ({sale.discount2_percent}%):
                                    </span>
                                    <span>
                                        -
                                        {formatCurrency(
                                            sale.discount2_amount ?? 0,
                                        )}
                                    </span>
                                </div>
                            )}
                            {formatNumber(sale.ppn_percent ?? 0) > 0 && (
                                <div className="flex justify-between text-blue-600 dark:text-blue-500">
                                    <span>PPN ({sale.ppn_percent}%):</span>
                                    <span>
                                        +{formatCurrency(sale.ppn_amount ?? 0)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                <span>TOTAL:</span>
                                <span>{formatCurrency(sale.total_amount)}</span>
                            </div>
                            {sale.status === 'confirmed' && (
                                <>
                                    <div className="flex justify-between border-t pt-2 text-red-600 dark:text-danger-500">
                                        <span>Total Cost (FIFO):</span>
                                        <span className="font-medium">
                                            {formatCurrency(sale.total_cost)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-green-600 dark:text-emerald-500">
                                        <span>PROFIT:</span>
                                        <span>
                                            {formatCurrency(sale.total_profit)}
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
                        <CardTitle>Detail Barang</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <TableLayout
                                tableColumn={tableColumn}
                                tableRow={sale.details}
                                pageFrom={1}
                                renderRow={(detail) => {
                                    return (
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
                                            <TableCell className="flex w-full items-center justify-center text-center text-red-600 dark:text-danger-500">
                                                {formatNumber(
                                                    detail.discount1_percent ??
                                                    0,
                                                ) > 0
                                                    ? `${detail.discount1_percent}%`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="flex w-full items-center justify-center text-center text-red-600 dark:text-danger-500">
                                                {formatNumber(
                                                    detail.discount2_percent ??
                                                    0,
                                                ) > 0
                                                    ? `${detail.discount2_percent}%`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="flex w-full items-center justify-center text-center">
                                                {formatCurrency(
                                                    detail.subtotal,
                                                )}
                                            </TableCell>
                                            {sale.status === 'confirmed' && (
                                                <>
                                                    <TableCell className="flex w-full items-center justify-center text-center text-red-600 dark:text-danger-500">
                                                        {formatCurrency(
                                                            detail.cost,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="flex w-full items-center justify-center text-center text-green-600 dark:text-emerald-500">
                                                        {formatCurrency(
                                                            detail.profit,
                                                        )}
                                                    </TableCell>
                                                </>
                                            )}
                                        </>
                                    );
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Modal
                    titleDesc={
                        sale.status === 'pending'
                            ? 'Konfirmasi Pembelian?'
                            : 'Batalkan Konfirmasi?'
                    }
                    contentDesc={
                        sale.status === 'pending'
                            ? 'Stock akan berkurang, profit akan dihitung, dan data tidak bisa diedit lagi.'
                            : 'Stock akan dikembalikan dan data bisa diedit kembali.'
                    }
                    submitText={
                        sale.status === 'pending'
                            ? 'Konfirmasi'
                            : 'Batalkan Konfirmasi'
                    }
                    isModalOpen={isConfirmModalOpen}
                    onModalClose={closeConfirmModal}
                    handleSubmit={
                        sale.status === 'pending'
                            ? handleConfirm
                            : handleUnconfirm
                    }
                />
            </AppLayout>
        </>
    );
};

export default SaleShow;
