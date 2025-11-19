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
import { index } from '@/routes/sale-returns';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    name: string;
}

interface Sale {
    id: number;
    sale_number: string;
    customer?: Customer;
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

interface SaleReturnDetail {
    id: number;
    item: Item;
    item_uom: ItemUom;
    quantity: string;
    price: string;
    discount1_percent: string;
    discount2_percent: string;
    subtotal: string;
    cost: string;
    profit_adjustment: string;
}

interface SaleReturn {
    id: number;
    return_number: string;
    sale: Sale;
    return_date: string;
    subtotal: string;
    discount1_percent: string;
    discount1_amount: string;
    discount2_percent: string;
    discount2_amount: string;
    ppn_percent: string;
    ppn_amount: string;
    total_amount: string;
    total_cost: string;
    total_profit_adjustment: string;
    status: 'pending' | 'confirmed';
    reason?: string;
    details: SaleReturnDetail[];
}

interface PageProps {
    return: SaleReturn;
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
                'Konfirmasi retur? Stock akan bertambah, profit akan di-adjust, dan data tidak bisa diedit lagi.',
            )
        ) {
            router.post(
                `/sale-returns/${returnData.id}/confirm`,
                {},
                {
                    onSuccess: () =>
                        toast.success('Retur penjualan dikonfirmasi'),
                    onError: () => toast.error('Gagal konfirmasi retur'),
                },
            );
        }
    };

    const handleUnconfirm = () => {
        if (confirm('Batalkan konfirmasi? Stock akan dikurangi kembali.')) {
            router.post(
                `/sale-returns/${returnData.id}/unconfirm`,
                {},
                {
                    onSuccess: () => toast.success('Konfirmasi dibatalkan'),
                    onError: () => toast.error('Gagal membatalkan konfirmasi'),
                },
            );
        }
    };

    const handleDelete = () => {
        if (confirm('Hapus retur penjualan ini?')) {
            router.delete(`/sale-returns/${returnData.id}`, {
                onSuccess: () => toast.success('Retur penjualan dihapus'),
                onError: () => toast.error('Gagal menghapus retur'),
            });
        }
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Retur Jual ${returnData.return_number}`} />

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <PageTitle
                            title={`Retur Jual ${returnData.return_number}`}
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
                            {returnData.status === 'confirmed' && (
                                <>
                                    <div className="flex justify-between border-t pt-2 text-orange-600">
                                        <span>Total Cost:</span>
                                        <span className="font-medium">
                                            {formatCurrency(
                                                returnData.total_cost,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-red-600">
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
                                    {returnData.status === 'confirmed' && (
                                        <>
                                            <TableHead className="text-right">
                                                Cost
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Profit Adj.
                                            </TableHead>
                                        </>
                                    )}
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
                                        {returnData.status === 'confirmed' && (
                                            <>
                                                <TableCell className="text-right text-orange-600">
                                                    {formatCurrency(
                                                        detail.cost,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-red-600">
                                                    {formatCurrency(
                                                        detail.profit_adjustment,
                                                    )}
                                                </TableCell>
                                            </>
                                        )}
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
