import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import {
    cn,
    formatCurrency,
    formatDatetoString,
    formatNumberWithSeparator,
} from '@/lib/utils';
import { destroy, index } from '@/routes/stock-adjustments';
import { BreadcrumbItem, IStockAdjustment } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    adjustment: IStockAdjustment;
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
        if (
            confirm('Apakah Anda yakin ingin menghapus penyesuaian stok ini?')
        ) {
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
                <div className="mb-4 flex items-center justify-between">
                    <PageTitle title="Detail Penyesuaian Stok" />
                    <div className="flex gap-2">
                        <Button onClick={handleDelete} className="btn-danger">
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
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Tanggal Penyesuaian
                                    </Label>
                                    <p className="text-base">
                                        {formatDatetoString(
                                            new Date(adjustment.movement_date),
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Barang
                                    </label>
                                    <p className="text-base">
                                        {adjustment.item?.code && (
                                            <span className="font-medium">
                                                {adjustment.item.code} -{' '}
                                            </span>
                                        )}
                                        {adjustment.item?.name || '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Jumlah
                                    </label>
                                    <div className="text-base">
                                        <Badge
                                            variant={
                                                adjustment.quantity > 0
                                                    ? 'default'
                                                    : 'destructive'
                                            }
                                            className={cn(
                                                adjustment.quantity > 0
                                                    ? 'badge-green-light'
                                                    : 'badge-red-light',
                                            )}
                                        >
                                            {adjustment.quantity > 0 ? '+' : ''}
                                            {formatNumberWithSeparator(
                                                adjustment.quantity,
                                            )}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Harga Satuan
                                    </label>
                                    <p className="text-base">
                                        {formatCurrency(adjustment.unit_cost)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Total Nilai
                                    </label>
                                    <p className="text-base font-semibold">
                                        {formatCurrency(
                                            Math.abs(adjustment.quantity) *
                                                adjustment.unit_cost,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Catatan
                                    </label>
                                    <p className="text-base">
                                        {adjustment.notes || '-'}
                                    </p>
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
