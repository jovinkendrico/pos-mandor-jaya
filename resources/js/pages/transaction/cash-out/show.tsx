import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Modal from '@/components/ui/Modal/Modal';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { edit, index } from '@/routes/cash-outs';
import { BreadcrumbItem, ICashOut } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Pencil, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    cashOut: ICashOut;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Kas Keluar',
        href: index().url,
    },
    {
        title: 'Detail',
        href: '#',
    },
];

const CashOutShow = (props: PageProps) => {
    const { cashOut } = props;

    const {
        isOpen: isConfirmModalOpen,
        openModal: openConfirmModal,
        closeModal: closeConfirmModal,
    } = useDisclosure();

    const handlePost = () => {
        router.post(
            `/cash-outs/${cashOut.id}/post`,
            {},
            {
                onSuccess: () => {
                    toast.success('Kas keluar berhasil diposting ke jurnal');
                    closeConfirmModal();
                },
                onError: (errors: Record<string, string>) => {
                    const message = errors.msg || 'Gagal memposting kas keluar';
                    toast.error(message);
                    closeConfirmModal();
                },
            },
        );
    };

    const handleReverse = () => {
        router.post(
            `/cash-outs/${cashOut.id}/reverse`,
            {},
            {
                onSuccess: () => {
                    toast.success('Kas keluar berhasil di-reverse');
                    closeConfirmModal();
                },
                onError: () => {
                    toast.error('Gagal reverse kas keluar');
                    closeConfirmModal();
                },
            },
        );
    };

    const handleEdit = () => {
        router.visit(edit(cashOut.id!).url);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Kas Keluar ${cashOut.cash_out_number}`} />

                <div className="mb-2 flex items-center justify-between">
                    <div>
                        <div className="flex flex-row items-center gap-2">
                            <Link href={index().url}>
                                <ArrowLeft className="h-8 w-8" />
                            </Link>
                            <PageTitle
                                title={`Kas Keluar ${cashOut.cash_out_number}`}
                            />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge
                                className={cn(
                                    cashOut.status === 'posted'
                                        ? 'badge-green-light'
                                        : 'badge-yellow-light',
                                )}
                            >
                                {cashOut.status === 'posted'
                                    ? 'Posted'
                                    : 'Draft'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {cashOut.status === 'draft' && (
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
                                    Post ke Jurnal
                                </Button>
                            </>
                        )}
                        {cashOut.status === 'posted' && (
                            <Button
                                onClick={openConfirmModal}
                                className="btn-danger"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">
                                    Reverse
                                </span>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card className="content">
                        <CardHeader>
                            <CardTitle>Informasi Kas Keluar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Nomor:
                                </span>
                                <span className="font-medium">
                                    {cashOut.cash_out_number}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Tanggal:
                                </span>
                                <span className="font-medium">
                                    {formatDatetoString(
                                        new Date(cashOut.cash_out_date),
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Bank/Kas:
                                </span>
                                <span className="font-medium">
                                    {cashOut.bank?.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Akun Pengeluaran:
                                </span>
                                <span className="font-medium">
                                    {cashOut.chart_of_account?.code || ''} -{' '}
                                    {cashOut.chart_of_account?.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Jumlah:
                                </span>
                                <span className="text-lg font-medium">
                                    {formatCurrency(cashOut.amount)}
                                </span>
                            </div>
                            {cashOut.description && (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">
                                        Keterangan:
                                    </span>
                                    <span className="mt-1 font-medium">
                                        {cashOut.description}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Created By:
                                </span>
                                <span className="font-medium">
                                    {cashOut.creator?.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Updated By:
                                </span>
                                <span className="font-medium">
                                    {cashOut.updater?.name || '-'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Modal
                    titleDesc={
                        cashOut.status === 'draft'
                            ? 'Post Kas Keluar?'
                            : 'Reverse Kas Keluar?'
                    }
                    contentDesc={
                        cashOut.status === 'draft'
                            ? 'Data akan diposting ke jurnal dan tidak bisa diedit lagi.'
                            : 'Jurnal akan dibalik dan data bisa diedit kembali.'
                    }
                    submitText={cashOut.status === 'draft' ? 'Post' : 'Reverse'}
                    isModalOpen={isConfirmModalOpen}
                    onModalClose={closeConfirmModal}
                    handleSubmit={
                        cashOut.status === 'draft' ? handlePost : handleReverse
                    }
                />
            </AppLayout>
        </>
    );
};

export default CashOutShow;

