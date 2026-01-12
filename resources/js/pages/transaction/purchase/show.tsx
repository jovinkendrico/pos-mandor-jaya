import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import DotMatrixPrintButton from '@/components/DotMatrixPrintButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Modal from '@/components/ui/Modal/Modal';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { PurchaseStatus } from '@/constants/enum';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import {
    cn,
    formatCurrency,
    formatDatetoString,
    formatNumberWithSeparator,
    formatNumber,
} from '@/lib/utils';
import { edit, index, print } from '@/routes/purchases';
import { BreadcrumbItem, IItem, IPurchase } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Download,
    Pencil,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    purchase: IPurchase;
    items: IItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Pembelian',
        href: index().url,
    },
    {
        title: 'Detail',
        href: '#',
    },
];

const PurchaseShow = (props: PageProps) => {
    const { purchase } = props;

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
        'Disc 3 (%)',
        'Disc 4 (%)',
        'Subtotal',
    ];

    const handleConfirm = () => {
        router.post(
            `/purchases/${purchase.id}/confirm`,
            {},
            {
                onSuccess: () => {
                    toast.success('Pembelian dikonfirmasi');
                    closeConfirmModal();
                },
                onError: (errors: Record<string, string>) => {
                    const message = errors.msg || 'Gagal konfirmasi pembelian';
                    closeConfirmModal();
                    toast.error(message);
                },
            },
        );
    };

    const handleUnconfirm = () => {
        router.post(
            `/purchases/${purchase.id}/unconfirm`,
            {},
            {
                onSuccess: () => {
                    toast.success('Konfirmasi dibatalkan');
                    closeConfirmModal();
                },
                onError: () => toast.error('Gagal membatalkan konfirmasi'),
            },
        );
    };

    const handleEdit = () => {
        router.visit(edit(purchase.id).url);
    };

    const handleWriteOff = () => {
        if (confirm(`Write-off selisih pembulatan sebesar ${formatCurrency(purchase.remaining_amount || 0)}?\n\nIni akan otomatis membuat pembayaran untuk sisa amount dan menutup invoice.`)) {
            router.post(
                `/purchases/${purchase.id}/write-off`,
                {},
                {
                    onSuccess: () => toast.success('Selisih berhasil di-write-off'),
                    onError: (errors: Record<string, string>) => {
                        const message = errors.msg || Object.values(errors)[0] || 'Gagal write-off';
                        toast.error(message);
                    },
                },
            );
        }
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Pembelian ${purchase.purchase_number}`} />

                <div className="mb-2 flex items-center justify-between">
                    <div>
                        <div className="flex flex-row items-center gap-2">
                            <div
                                className="cursor-pointer"
                                onClick={() => window.history.back()}
                            >
                                <ArrowLeft className="h-8 w-8" />
                            </div>
                            <PageTitle
                                title={`Pembelian ${purchase.purchase_number}`}
                            />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge
                                className={cn(
                                    purchase.status === PurchaseStatus.PENDING
                                        ? 'badge-yellow-light'
                                        : 'badge-green-light',
                                )}
                            >
                                {purchase.status === PurchaseStatus.CONFIRMED
                                    ? 'Confirmed'
                                    : 'Pending'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {purchase.status === PurchaseStatus.PENDING && purchase.can?.edit && (
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
                        {purchase.status === PurchaseStatus.CONFIRMED && purchase.can?.edit && (
                            <Button
                                onClick={openConfirmModal}
                                className="btn-danger"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Batalkan Konfirmasi
                            </Button>
                        )}
                        {(purchase.remaining_amount ?? 0) > 0 && (purchase.remaining_amount ?? 0) < 1000 && (
                            <Button
                                onClick={handleWriteOff}
                                variant="outline"
                                className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-950"
                            >
                                Write-off {formatCurrency(purchase.remaining_amount ?? 0)}
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex w-full justify-end gap-2">
                    <DotMatrixPrintButton
                        data={{
                            purchase_number: purchase.purchase_number,
                            date: formatDatetoString(new Date(purchase.purchase_date)),
                            due_date: purchase.due_date ? formatDatetoString(new Date(purchase.due_date)) : undefined,
                            supplier_name: purchase.supplier?.name,
                            supplier_city: purchase.supplier?.city?.name,
                            supplier_phone: purchase.supplier?.phone_number,
                            total: purchase.total_amount,
                            notes: purchase.notes,
                            details: purchase.details.map(d => ({
                                item_name: d.item?.name || '?',
                                uom: d.item_uom?.uom.name || '',
                                quantity: Number(d.quantity),
                                price: Number(d.price),
                                subtotal: Number(d.subtotal)
                            }))
                        }}
                    />
                    <Button
                        className="btn-primary"
                        onClick={() => {
                            window.location.href = print(purchase.id).url;
                        }}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download Invoice
                    </Button>
                </div>

                {/* Purchase Info */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card className="content">
                        <CardHeader>
                            <CardTitle>Informasi Pembelian</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Supplier:
                                </span>
                                <span className="font-medium">
                                    {purchase.supplier?.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    No. HP:
                                </span>
                                <span className="font-medium">
                                    {purchase.supplier?.phone_number || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Kota:
                                </span>
                                <span className="font-medium">
                                    {purchase.supplier?.city?.name || '-'}
                                </span>
                            </div>
                            {purchase.supplier?.address && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Alamat:
                                    </span>
                                    <span className="font-medium text-right max-w-[50%]">
                                        {purchase.supplier.address}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Tanggal:
                                </span>
                                <span className="font-medium">
                                    {formatDatetoString(
                                        new Date(purchase.purchase_date),
                                    )}
                                </span>
                            </div>
                            {purchase.due_date && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Jatuh Tempo:
                                    </span>
                                    <span className="font-medium">
                                        {formatDatetoString(
                                            new Date(purchase.due_date),
                                        )}
                                    </span>
                                </div>
                            )}
                            {purchase.notes && (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">
                                        Catatan:
                                    </span>
                                    <span className="mt-1 font-medium">
                                        {purchase.notes}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Created By:
                                </span>
                                <span className="font-medium">
                                    {purchase.creator?.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Updated By:
                                </span>
                                <span className="font-medium">
                                    {purchase.updater?.name || '-'}
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
                                    {formatCurrency(purchase.subtotal ?? 0)}
                                </span>
                            </div>
                            {Number(purchase.discount1_percent ?? 0) >
                                0 && (
                                    <div className="flex justify-between text-red-600 dark:text-danger-400">
                                        <span>
                                            Diskon 1 (
                                            {purchase.discount1_percent ?? 0}
                                            %):
                                        </span>
                                        <span>
                                            -
                                            {formatCurrency(
                                                purchase.discount1_amount ?? 0,
                                            )}
                                        </span>
                                    </div>
                                )}
                            {Number(purchase.discount2_percent ?? 0) >
                                0 && (
                                    <div className="flex justify-between text-red-600 dark:text-danger-400">
                                        <span>
                                            Diskon 2 (
                                            {purchase.discount2_percent ?? 0}
                                            %):
                                        </span>
                                        <span>
                                            -
                                            {formatCurrency(
                                                purchase.discount2_amount ?? 0,
                                            )}
                                        </span>
                                    </div>
                                )}
                            {Number(purchase.discount3_percent ?? 0) >
                                0 && (
                                    <div className="flex justify-between text-red-600 dark:text-danger-400">
                                        <span>
                                            Diskon 3 (
                                            {purchase.discount3_percent ?? 0}
                                            %):
                                        </span>
                                        <span>
                                            -
                                            {formatCurrency(
                                                purchase.discount3_amount ?? 0,
                                            )}
                                        </span>
                                    </div>
                                )}
                            {Number(purchase.discount4_percent ?? 0) >
                                0 && (
                                    <div className="flex justify-between text-red-600 dark:text-danger-400">
                                        <span>
                                            Diskon 4 (
                                            {purchase.discount4_percent ?? 0}
                                            %):
                                        </span>
                                        <span>
                                            -
                                            {formatCurrency(
                                                purchase.discount4_amount ?? 0,
                                            )}
                                        </span>
                                    </div>
                                )}
                            {Number(purchase.ppn_percent ?? 0) > 0 && (
                                <div className="flex justify-between text-blue-600 dark:text-primary-700">
                                    <span>
                                        PPN (
                                        {purchase.ppn_percent ?? 0}
                                        %):
                                    </span>
                                    <span>
                                        +
                                        {formatCurrency(
                                            purchase.ppn_amount ?? 0,
                                        )}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                <span>TOTAL:</span>
                                <span>
                                    {formatCurrency(purchase.total_amount)}
                                </span>
                            </div>
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
                                tableRow={purchase.details}
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
                                            {formatNumberWithSeparator(
                                                detail.quantity,
                                            )}
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center">
                                            {formatCurrency(detail.price)}
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center text-red-600 dark:text-danger-400">
                                            {Number(
                                                detail.discount1_percent ?? 0,
                                            ) > 0
                                                ? `${detail.discount1_percent ??
                                                0}%`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center text-red-600 dark:text-danger-400">
                                            {Number(
                                                detail.discount2_percent ?? 0,
                                            ) > 0
                                                ? `${detail.discount2_percent ??
                                                0}%`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center text-red-600 dark:text-danger-400">
                                            {Number(
                                                detail.discount3_percent ?? 0,
                                            ) > 0
                                                ? `${detail.discount3_percent ??
                                                0}%`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center text-red-600 dark:text-danger-400">
                                            {Number(
                                                detail.discount4_percent ?? 0,
                                            ) > 0
                                                ? `${detail.discount4_percent ??
                                                0}%`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="flex w-full items-center justify-center text-center">
                                            {formatCurrency(
                                                detail.subtotal ?? 0,
                                            )}
                                        </TableCell>
                                    </>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Modal
                    titleDesc={
                        purchase.status === 'pending'
                            ? 'Konfirmasi Pembelian?'
                            : 'Batalkan Konfirmasi?'
                    }
                    contentDesc={
                        purchase.status === 'pending'
                            ? 'Stock akan bertambah dan data tidak bisa diedit lagi.'
                            : 'Stock akan dikembalikan dan data bisa diedit kembali.'
                    }
                    submitText={
                        purchase.status === 'pending'
                            ? 'Konfirmasi'
                            : 'Batalkan Konfirmasi'
                    }
                    isModalOpen={isConfirmModalOpen}
                    onModalClose={closeConfirmModal}
                    handleSubmit={
                        purchase.status === 'pending'
                            ? handleConfirm
                            : handleUnconfirm
                    }
                />
            </AppLayout>
        </>
    );
};

export default PurchaseShow;
