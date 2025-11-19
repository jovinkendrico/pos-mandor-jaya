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
import { index } from '@/routes/purchase-returns';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
    id: number;
    name: string;
}

interface Purchase {
    id: number;
    purchase_number: string;
    supplier?: Supplier;
}

interface Item {
    id: number;
    code: string;
    name: string;
}

interface ItemUom {
    id: number;
    uom_name: string;
}

interface PurchaseReturnDetail {
    id: number;
    item: Item;
    item_uom: ItemUom;
    quantity: string;
    price: string;
    discount1_percent: string;
    discount2_percent: string;
    subtotal: string;
}

interface PurchaseReturn {
    id: number;
    return_number: string;
    purchase: Purchase;
    return_date: string;
    subtotal: string;
    discount1_percent: string;
    discount1_amount: string;
    discount2_percent: string;
    discount2_amount: string;
    ppn_percent: string;
    ppn_amount: string;
    total_amount: string;
    status: 'pending' | 'confirmed';
    reason?: string;
    details: PurchaseReturnDetail[];
}

interface PageProps {
    return: PurchaseReturn;
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

export default function PurchaseReturnShow({ return: returnData }: PageProps) {
    const formatCurrency = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleConfirm = () => {
        if (
            confirm(
                'Konfirmasi retur? Stock akan berkurang dan data tidak bisa diedit lagi.',
            )
        ) {
            router.post(
                `/purchase-returns/${returnData.id}/confirm`,
                {},
                {
                    onSuccess: () =>
                        toast.success('Retur pembelian dikonfirmasi'),
                    onError: () => toast.error('Gagal konfirmasi retur'),
                },
            );
        }
    };

    const handleUnconfirm = () => {
        if (confirm('Batalkan konfirmasi? Stock akan dikembalikan.')) {
            router.post(
                `/purchase-returns/${returnData.id}/unconfirm`,
                {},
                {
                    onSuccess: () => toast.success('Konfirmasi dibatalkan'),
                    onError: () => toast.error('Gagal membatalkan konfirmasi'),
                },
            );
        }
    };

    const handleDelete = () => {
        if (confirm('Hapus retur pembelian ini?')) {
            router.delete(`/purchase-returns/${returnData.id}`, {
                onSuccess: () => toast.success('Retur pembelian dihapus'),
                onError: () => toast.error('Gagal menghapus retur'),
            });
        }
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Retur Beli ${returnData.return_number}`} />

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <PageTitle
                            title={`Retur Beli ${returnData.return_number}`}
                        />
                        <div className="mt-2 flex items-center gap-2">
                            <Badge
                                variant={
                                    returnData.status === 'confirmed'
                                        ? 'default'
                                        : 'secondary'
                                }
                                className="text-sm"
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
                                    onClick={handleDelete}
                                    variant="destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                </Button>
                                <Button onClick={handleConfirm}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Konfirmasi
                                </Button>
                            </>
                        )}
                        {returnData.status === 'confirmed' && (
                            <Button
                                onClick={handleUnconfirm}
                                variant="destructive"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Batalkan Konfirmasi
                            </Button>
                        )}
                    </div>
                </div>

                {/* Return Info */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Retur</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    No. Pembelian:
                                </span>
                                <span className="font-mono font-medium">
                                    {returnData.purchase.purchase_number}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Supplier:
                                </span>
                                <span className="font-medium">
                                    {returnData.purchase.supplier?.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Tanggal Retur:
                                </span>
                                <span className="font-medium">
                                    {formatDate(returnData.return_date)}
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

                    <Card>
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
                            {parseFloat(returnData.discount1_amount) > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Total Diskon 1:</span>
                                    <span>
                                        -
                                        {formatCurrency(
                                            returnData.discount1_amount,
                                        )}
                                    </span>
                                </div>
                            )}
                            {parseFloat(returnData.discount2_amount) > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Total Diskon 2:</span>
                                    <span>
                                        -
                                        {formatCurrency(
                                            returnData.discount2_amount,
                                        )}
                                    </span>
                                </div>
                            )}
                            {parseFloat(returnData.ppn_amount) > 0 && (
                                <div className="flex justify-between text-blue-600">
                                    <span>
                                        PPN ({returnData.ppn_percent}%):
                                    </span>
                                    <span>
                                        +{formatCurrency(returnData.ppn_amount)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                <span>TOTAL:</span>
                                <span>
                                    {formatCurrency(returnData.total_amount)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Items Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Barang Diretur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">
                                        Kode
                                    </TableHead>
                                    <TableHead>Nama Item</TableHead>
                                    <TableHead>UOM</TableHead>
                                    <TableHead className="text-right">
                                        Qty Retur
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Harga
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Disc 1
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Disc 2
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Subtotal
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {returnData.details.map((detail) => (
                                    <TableRow key={detail.id}>
                                        <TableCell className="font-mono">
                                            {detail.item.code}
                                        </TableCell>
                                        <TableCell>
                                            {detail.item.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {detail.item_uom.uom_name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {parseFloat(
                                                detail.quantity,
                                            ).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(detail.price)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            {parseFloat(
                                                detail.discount1_percent,
                                            ) > 0
                                                ? `${detail.discount1_percent}%`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            {parseFloat(
                                                detail.discount2_percent,
                                            ) > 0
                                                ? `${detail.discount2_percent}%`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(detail.subtotal)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </AppLayout>
        </>
    );
}
