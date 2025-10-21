import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { index, edit } from '@/routes/purchases';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
    id: number;
    name: string;
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

interface PurchaseDetail {
    id: number;
    item: Item;
    item_uom: ItemUom;
    quantity: string;
    price: string;
    discount1_percent: string;
    discount1_amount: string;
    discount2_percent: string;
    discount2_amount: string;
    subtotal: string;
}

interface Purchase {
    id: number;
    purchase_number: string;
    supplier?: Supplier;
    purchase_date: string;
    due_date?: string;
    subtotal: string;
    discount1_percent: string;
    discount1_amount: string;
    discount2_percent: string;
    discount2_amount: string;
    total_after_discount: string;
    ppn_percent: string;
    ppn_amount: string;
    total_amount: string;
    status: 'pending' | 'confirmed';
    notes?: string;
    details: PurchaseDetail[];
}

interface PageProps {
    purchase: Purchase;
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

export default function PurchaseShow({ purchase }: PageProps) {
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
        if (confirm('Konfirmasi pembelian? Stock akan bertambah dan data tidak bisa diedit lagi.')) {
            router.post(`/purchases/${purchase.id}/confirm`, {}, {
                onSuccess: () => toast.success('Pembelian dikonfirmasi'),
                onError: () => toast.error('Gagal konfirmasi pembelian'),
            });
        }
    };

    const handleUnconfirm = () => {
        if (confirm('Batalkan konfirmasi? Stock akan dikembalikan dan data bisa diedit kembali.')) {
            router.post(`/purchases/${purchase.id}/unconfirm`, {}, {
                onSuccess: () => toast.success('Konfirmasi dibatalkan'),
                onError: () => toast.error('Gagal membatalkan konfirmasi'),
            });
        }
    };

    const handleEdit = () => {
        router.visit(edit(purchase.id).url);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Pembelian ${purchase.purchase_number}`} />

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <PageTitle title={`Pembelian ${purchase.purchase_number}`} />
                        <div className="flex gap-2 items-center mt-2">
                            <Badge variant={purchase.status === 'confirmed' ? 'default' : 'secondary'} className="text-sm">
                                {purchase.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {purchase.status === 'pending' && (
                            <>
                                <Button onClick={handleEdit} variant="outline">
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                                <Button onClick={handleConfirm}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Konfirmasi
                                </Button>
                            </>
                        )}
                        {purchase.status === 'confirmed' && (
                            <Button onClick={handleUnconfirm} variant="destructive">
                                <XCircle className="h-4 w-4 mr-2" />
                                Batalkan Konfirmasi
                            </Button>
                        )}
                    </div>
                </div>

                {/* Purchase Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Pembelian</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Supplier:</span>
                                <span className="font-medium">{purchase.supplier?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tanggal:</span>
                                <span className="font-medium">{formatDate(purchase.purchase_date)}</span>
                            </div>
                            {purchase.due_date && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Jatuh Tempo:</span>
                                    <span className="font-medium">{formatDate(purchase.due_date)}</span>
                                </div>
                            )}
                            {purchase.notes && (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Catatan:</span>
                                    <span className="font-medium mt-1">{purchase.notes}</span>
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
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>{formatCurrency(purchase.subtotal)}</span>
                            </div>
                            {parseFloat(purchase.discount1_percent) > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Diskon 1 ({purchase.discount1_percent}%):</span>
                                    <span>-{formatCurrency(purchase.discount1_amount)}</span>
                                </div>
                            )}
                            {parseFloat(purchase.discount2_percent) > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Diskon 2 ({purchase.discount2_percent}%):</span>
                                    <span>-{formatCurrency(purchase.discount2_amount)}</span>
                                </div>
                            )}
                            {parseFloat(purchase.ppn_percent) > 0 && (
                                <div className="flex justify-between text-blue-600">
                                    <span>PPN ({purchase.ppn_percent}%):</span>
                                    <span>+{formatCurrency(purchase.ppn_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>TOTAL:</span>
                                <span>{formatCurrency(purchase.total_amount)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Items Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Kode</TableHead>
                                    <TableHead>Nama Item</TableHead>
                                    <TableHead>UOM</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Harga</TableHead>
                                    <TableHead className="text-right">Disc 1</TableHead>
                                    <TableHead className="text-right">Disc 2</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchase.details.map((detail) => (
                                    <TableRow key={detail.id}>
                                        <TableCell className="font-mono">{detail.item.code}</TableCell>
                                        <TableCell>{detail.item.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{detail.item_uom.uom_name}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {parseFloat(detail.quantity).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(detail.price)}</TableCell>
                                        <TableCell className="text-right text-red-600">
                                            {parseFloat(detail.discount1_percent) > 0
                                                ? `${detail.discount1_percent}%`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            {parseFloat(detail.discount2_percent) > 0
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

