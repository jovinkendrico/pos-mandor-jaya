import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { BreadcrumbItem, CashIn } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    cashIn: CashIn;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Kas Masuk',
        href: '/cash-ins',
    },
    {
        title: 'Detail',
        href: '#',
    },
];

export default function CashInShow({ cashIn }: PageProps) {
    const handlePost = () => {
        router.post(
            `/cash-ins/${cashIn.id}/post`,
            {},
            {
                onSuccess: () => {
                    toast.success('Kas masuk berhasil diposting ke jurnal');
                },
                onError: () => {
                    toast.error('Gagal memposting kas masuk');
                },
            },
        );
    };

    const handleReverse = () => {
        if (
            !confirm(
                'Apakah Anda yakin ingin membatalkan posting kas masuk ini?',
            )
        ) {
            return;
        }

        router.post(
            `/cash-ins/${cashIn.id}/reverse`,
            {},
            {
                onSuccess: () => {
                    toast.success('Kas masuk berhasil di-reverse');
                },
                onError: () => {
                    toast.error('Gagal reverse kas masuk');
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Kas Masuk #${cashIn.cash_in_number}`} />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title={`Kas Masuk #${cashIn.cash_in_number}`} />
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => router.visit('/cash-ins')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                    {cashIn.status === 'draft' && (
                        <Button
                            onClick={handlePost}
                            className="btn-primary"
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Post ke Jurnal
                        </Button>
                    )}
                    {cashIn.status === 'posted' && (
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
                        <CardTitle>Informasi Kas Masuk</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Nomor
                            </p>
                            <p className="font-medium">{cashIn.cash_in_number}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tanggal
                            </p>
                            <p className="font-medium">
                                {formatDatetoString(
                                    new Date(cashIn.cash_in_date),
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Bank/Kas
                            </p>
                            <p className="font-medium">
                                {cashIn.bank?.name || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Akun Pendapatan
                            </p>
                            <p className="font-medium">
                                {cashIn.chart_of_account?.code || ''} -{' '}
                                {cashIn.chart_of_account?.name || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Jumlah
                            </p>
                            <p className="font-medium text-lg">
                                {formatCurrency(cashIn.amount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Status
                            </p>
                            <Badge
                                variant={
                                    cashIn.status === 'posted'
                                        ? 'default'
                                        : 'secondary'
                                }
                            >
                                {cashIn.status === 'posted' ? 'Posted' : 'Draft'}
                            </Badge>
                        </div>
                        {cashIn.description && (
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Keterangan
                                </p>
                                <p className="font-medium">
                                    {cashIn.description}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

