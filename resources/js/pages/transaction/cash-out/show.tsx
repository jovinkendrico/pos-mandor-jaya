import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { BreadcrumbItem, CashOut } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    cashOut: CashOut;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Kas Keluar',
        href: '/cash-outs',
    },
    {
        title: 'Detail',
        href: '#',
    },
];

export default function CashOutShow({ cashOut }: PageProps) {
    const handlePost = () => {
        router.post(
            `/cash-outs/${cashOut.id}/post`,
            {},
            {
                onSuccess: () => {
                    toast.success('Kas keluar berhasil diposting ke jurnal');
                },
                onError: () => {
                    toast.error('Gagal memposting kas keluar');
                },
            },
        );
    };

    const handleReverse = () => {
        if (
            !confirm(
                'Apakah Anda yakin ingin membatalkan posting kas keluar ini?',
            )
        ) {
            return;
        }

        router.post(
            `/cash-outs/${cashOut.id}/reverse`,
            {},
            {
                onSuccess: () => {
                    toast.success('Kas keluar berhasil di-reverse');
                },
                onError: () => {
                    toast.error('Gagal reverse kas keluar');
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Kas Keluar #${cashOut.cash_out_number}`} />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title={`Kas Keluar #${cashOut.cash_out_number}`} />
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => router.visit('/cash-outs')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                    {cashOut.status === 'draft' && (
                        <Button
                            onClick={handlePost}
                            className="btn-primary"
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Post ke Jurnal
                        </Button>
                    )}
                    {cashOut.status === 'posted' && (
                        <Button
                            variant="destructive"
                            onClick={handleReverse}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reverse
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Kas Keluar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Nomor
                            </p>
                            <p className="font-medium">
                                {cashOut.cash_out_number}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tanggal
                            </p>
                            <p className="font-medium">
                                {formatDatetoString(
                                    new Date(cashOut.cash_out_date),
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Bank/Kas
                            </p>
                            <p className="font-medium">
                                {cashOut.bank?.name || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Akun Pengeluaran
                            </p>
                            <p className="font-medium">
                                {cashOut.chart_of_account?.code || ''} -{' '}
                                {cashOut.chart_of_account?.name || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Jumlah
                            </p>
                            <p className="font-medium text-lg">
                                {formatCurrency(cashOut.amount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Status
                            </p>
                            <Badge
                                variant={
                                    cashOut.status === 'posted'
                                        ? 'default'
                                        : 'secondary'
                                }
                            >
                                {cashOut.status === 'posted' ? 'Posted' : 'Draft'}
                            </Badge>
                        </div>
                        {cashOut.description && (
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Keterangan
                                </p>
                                <p className="font-medium">
                                    {cashOut.description}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

