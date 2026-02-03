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
import { index } from '@/routes/purchase-returns';
import { BreadcrumbItem, IPurchaseReturn } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    purchaseReturn: IPurchaseReturn;
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
    const { purchaseReturn } = props;

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
            `/purchase-returns/${purchaseReturn.id}/confirm`,
            {},
            {
                onSuccess: (page) => {
                    const flash = page.props.flash as { error?: string; success?: string };
                    if (flash.error) {
                        toast.error(flash.error);
                    } else if (flash.success) {
                        toast.success(flash.success);
                    }
                    closeConfirmModal();
                },
                onError: (errors: Record<string, string>) => {
                    const message = errors.error || errors.msg || errors.message || 'Gagal konfirmasi retur';
                    toast.error(message);
                    closeConfirmModal();
                },
            },
        );
    };

    const handleUnconfirm = () => {
        router.post(
            `/purchase-returns/${purchaseReturn.id}/unconfirm`,
            {},
            {
                onSuccess: (page) => {
                    const flash = page.props.flash as { error?: string; success?: string };
                    if (flash.error) {
                        toast.error(flash.error);
                    } else if (flash.success) {
                        toast.success(flash.success);
                    }
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
                <Head title={`Retur Beli ${purchaseReturn.return_number}`} />

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex flex-row items-center gap-2">
                            <Link href={index().url}>
                                <ArrowLeft className="h-8 w-8" />
                            </Link>
                            <PageTitle
                                title={`Retur Beli ${purchaseReturn.return_number}`}
                            />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge
                                variant={
                                    purchaseReturn.status === 'confirmed'
                                        ? 'default'
                                        : 'secondary'
                                }
                                className={cn(
                                    purchaseReturn.status === 'pending'
                                        ? 'badge-yellow-light'
                                        : 'badge-green-light',
                                )}
                            >
                                {purchaseReturn.status === 'confirmed'
                                    ? 'Confirmed'
                                    : 'Pending'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <DotMatrixPrintButton
                            data={{
                                purchase_number: purchaseReturn.return_number,
                                date: (() => {
                                    const d = new Date(purchaseReturn.return_date);
                                    const day = String(d.getDate()).padStart(2, '0');
                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                    const year = d.getFullYear();
                                    return `${day}-${month}-${year}`;
                                })(),
                                supplier_name: purchaseReturn.purchase.supplier?.name,
                                supplier_city: purchaseReturn.purchase.supplier?.city?.name,
                                supplier_phone: purchaseReturn.purchase.supplier?.phone_number,
                                total: purchaseReturn.total_amount,
                                details: purchaseReturn.details.map((d: any) => ({
                                    item_name: d.item?.name || '?',
                                    uom: d.item_uom?.uom.name || '',
                                    quantity: Number(d.quantity),
                                    price: Number(d.price),
                                    subtotal: Number(d.subtotal)
                                }))
                            }}
                        />
                        {purchaseReturn.status === 'pending' && (
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
                        {purchaseReturn.status === 'confirmed' && (
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
                                    {purchaseReturn.purchase.purchase_number}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Supplier:
                                </span>
                                <span className="font-medium">
                                    {purchaseReturn.purchase.supplier?.name ||
                                        '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Tanggal Retur:
                                </span>
                                <span className="font-medium">
                                    {formatDatetoString(
                                        new Date(purchaseReturn.return_date),
                                    )}
                                </span>
                            </div>
                            {purchaseReturn.reason && (
                                <div className="flex flex-col border-t pt-2">
                                    <span className="text-muted-foreground">
                                        Alasan:
                                    </span>
                                    <span className="mt-1 font-medium">
                                        {purchaseReturn.reason}
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
                                    {formatCurrency(purchaseReturn.subtotal)}
                                </span>
                            </div>
                            {formatNumber(
                                purchaseReturn.discount1_amount ?? 0,
                            ) > 0 && (
                                    <div className="flex justify-between text-red-600 dark:text-danger-400">
                                        <span>Total Diskon 1:</span>
                                        <span>
                                            -
                                            {formatCurrency(
                                                purchaseReturn.discount1_amount ??
                                                0,
                                            )}
                                        </span>
                                    </div>
                                )}
                            {formatNumber(
                                purchaseReturn.discount2_amount ?? 0,
                            ) > 0 && (
                                    <div className="flex justify-between text-red-600 dark:text-danger-400">
                                        <span>Total Diskon 2:</span>
                                        <span>
                                            -
                                            {formatCurrency(
                                                purchaseReturn.discount2_amount ??
                                                0,
                                            )}
                                        </span>
                                    </div>
                                )}
                            {formatNumber(purchaseReturn.ppn_amount ?? 0) >
                                0 && (
                                    <div className="flex justify-between text-blue-600 dark:text-primary-700">
                                        <span>
                                            PPN ({purchaseReturn.ppn_percent}%):
                                        </span>
                                        <span>
                                            +
                                            {formatCurrency(
                                                purchaseReturn.ppn_amount ?? 0,
                                            )}
                                        </span>
                                    </div>
                                )}
                            <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                <span>TOTAL:</span>
                                <span>
                                    {formatCurrency(
                                        purchaseReturn.total_amount,
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
                                tableRow={purchaseReturn.details}
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
                                    </>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Modal
                    titleDesc={
                        purchaseReturn.status === 'pending'
                            ? 'Konfirmasi Retur Pembelian?'
                            : 'Batalkan Konfirmasi?'
                    }
                    contentDesc={
                        purchaseReturn.status === 'pending'
                            ? 'Stock akan berkurang dan data tidak bisa diedit lagi.'
                            : 'Stock akan dikembalikan.'
                    }
                    submitText={
                        purchaseReturn.status === 'pending'
                            ? 'Konfirmasi'
                            : 'Batalkan Konfirmasi'
                    }
                    isModalOpen={isConfirmModalOpen}
                    onModalClose={closeConfirmModal}
                    handleSubmit={
                        purchaseReturn.status === 'pending'
                            ? handleConfirm
                            : handleUnconfirm
                    }
                />
            </AppLayout>
        </>
    );
};

export default PurchaseReturnShow;
