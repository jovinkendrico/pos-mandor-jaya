import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { index, destroy } from '@/routes/stock-adjustments';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatNumberWithSeparator } from '@/lib/utils';
import { toast } from 'sonner';

interface StockAdjustment {
    id: number;
    item_id: number;
    item?: {
        id: number;
        name: string;
        code?: string;
    };
    quantity: number;
    unit_cost: number;
    movement_date: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    adjustment: StockAdjustment;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'Penyesuaian Stok',
        href: index().url,
    },
    {
        title: 'Detail',
        href: '#',
    },
];

const StockAdjustmentShow = (props: PageProps) => {
    const { adjustment } = props;

    const handleDelete = () => {
        if (confirm('Apakah Anda yakin ingin menghapus penyesuaian stok ini?')) {
            router.delete(destroy(adjustment.id).url, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Penyesuaian stok berhasil dihapus.');
                    router.visit(index().url);
                },
                onError: () => {
                    toast.error('Gagal menghapus penyesuaian stok.');
                },
            });
        }
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Detail Penyesuaian Stok" />
                <div className="flex justify-between items-center mb-4">
                    <PageTitle title="Detail Penyesuaian Stok" />
                    <div className="flex gap-2">
                        <Link href={index().url}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            Hapus
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Penyesuaian</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Tanggal Penyesuaian
                                    </label>
                                    <p className="text-base">{formatDate(adjustment.movement_date)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Barang
                                    </label>
                                    <p className="text-base">
                                        {adjustment.item?.code && (
                                            <span className="font-medium">{adjustment.item.code} - </span>
                                        )}
                                        {adjustment.item?.name || '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Jumlah
                                    </label>
                                    <p className="text-base">
                                        <Badge
                                            variant={adjustment.quantity > 0 ? 'default' : 'destructive'}
                                        >
                                            {adjustment.quantity > 0 ? '+' : ''}
                                            {formatNumberWithSeparator(adjustment.quantity)}
                                        </Badge>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Harga Satuan
                                    </label>
                                    <p className="text-base">{formatCurrency(adjustment.unit_cost)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Total Nilai
                                    </label>
                                    <p className="text-base font-semibold">
                                        {formatCurrency(Math.abs(adjustment.quantity) * adjustment.unit_cost)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Catatan
                                    </label>
                                    <p className="text-base">{adjustment.notes || '-'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        </>
    );
};

export default StockAdjustmentShow;

