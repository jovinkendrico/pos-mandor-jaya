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
import { index, edit } from '@/routes/sales';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
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

interface SaleDetail {
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
    cost: string;
    profit: string;
}

interface Sale {
    id: number;
    sale_number: string;
    customer?: Customer;
    sale_date: string;
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
    total_cost: string;
    total_profit: string;
    status: 'pending' | 'confirmed';
    notes?: string;
    details: SaleDetail[];
}

interface PageProps {
    sale: Sale;
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

export default function SaleShow({ sale }: PageProps) {
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
        if (confirm('Konfirmasi penjualan? Stock akan berkurang, profit akan dihitung, dan data tidak bisa diedit lagi.')) {
            router.post(`/sales/${sale.id}/confirm`, {}, {
                onSuccess: () => toast.success('Penjualan dikonfirmasi'),
                onError: () => toast.error('Gagal konfirmasi penjualan'),
            });
        }
    };

    const handleUnconfirm = () => {
        if (confirm('Batalkan konfirmasi? Stock akan dikembalikan dan data bisa diedit kembali.')) {
            router.post(`/sales/${sale.id}/unconfirm`, {}, {
                onSuccess: () => toast.success('Konfirmasi dibatalkan'),
                onError: () => toast.error('Gagal membatalkan konfirmasi'),
            });
        }
    };

    const handleEdit = () => {
        router.visit(edit(sale.id).url);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Penjualan ${sale.sale_number}`} />
                
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <PageTitle title={`Penjualan ${sale.sale_number}`} />
                        <div className="flex gap-2 items-center mt-2">
                            <Badge variant={sale.status === 'confirmed' ? 'default' : 'secondary'} className="text-sm">
                                {sale.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {sale.status === 'pending' && (
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
                        {sale.status === 'confirmed' && (
                            <Button onClick={handleUnconfirm} variant="destructive">
                                <XCircle className="h-4 w-4 mr-2" />
                                Batalkan Konfirmasi
                            </Button>
                        )}
                    </div>
                </div>

                {/* Sale Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Penjualan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Customer:</span>
                                <span className="font-medium">{sale.customer?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tanggal:</span>
                                <span className="font-medium">{formatDate(sale.sale_date)}</span>
                            </div>
                            {sale.due_date && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Jatuh Tempo:</span>
                                    <span className="font-medium">{formatDate(sale.due_date)}</span>
                                </div>
                            )}
                            {sale.notes && (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Catatan:</span>
                                    <span className="font-medium mt-1">{sale.notes}</span>
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
                                <span>{formatCurrency(sale.subtotal)}</span>
                            </div>
                            {parseFloat(sale.discount1_percent) > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Diskon 1 ({sale.discount1_percent}%):</span>
                                    <span>-{formatCurrency(sale.discount1_amount)}</span>
                                </div>
                            )}
                            {parseFloat(sale.discount2_percent) > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Diskon 2 ({sale.discount2_percent}%):</span>
                                    <span>-{formatCurrency(sale.discount2_amount)}</span>
                                </div>
                            )}
                            {parseFloat(sale.ppn_percent) > 0 && (
                                <div className="flex justify-between text-blue-600">
                                    <span>PPN ({sale.ppn_percent}%):</span>
                                    <span>+{formatCurrency(sale.ppn_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>TOTAL:</span>
                                <span>{formatCurrency(sale.total_amount)}</span>
                            </div>
                            {sale.status === 'confirmed' && (
                                <>
                                    <div className="flex justify-between text-orange-600 border-t pt-2">
                                        <span>Total Cost (FIFO):</span>
                                        <span className="font-medium">{formatCurrency(sale.total_cost)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600 font-bold text-lg">
                                        <span>PROFIT:</span>
                                        <span>{formatCurrency(sale.total_profit)}</span>
                                    </div>
                                </>
                            )}
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
                                    {sale.status === 'confirmed' && (
                                        <>
                                            <TableHead className="text-right">Cost</TableHead>
                                            <TableHead className="text-right">Profit</TableHead>
                                        </>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.details.map((detail) => (
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
                                        {sale.status === 'confirmed' && (
                                            <>
                                                <TableCell className="text-right text-orange-600">
                                                    {formatCurrency(detail.cost)}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600 font-medium">
                                                    {formatCurrency(detail.profit)}
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

