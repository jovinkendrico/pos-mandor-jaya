import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Modal from '@/components/ui/Modal/Modal';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { cn, formatCurrency, formatDatetoString } from '@/lib/utils';
import { edit, index } from '@/routes/cash-ins';
import { BreadcrumbItem, ICashIn } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Pencil, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    cashIn: ICashIn;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Kas Masuk',
        href: index().url,
    },
    {
        title: 'Detail',
        href: '#',
    },
];

const CashInShow = (props: PageProps) => {
    const { cashIn } = props;

    const {
        isOpen: isConfirmModalOpen,
        openModal: openConfirmModal,
        closeModal: closeConfirmModal,
    } = useDisclosure();

    const handlePost = () => {
        router.post(
            `/cash-ins/${cashIn.id}/post`,
            {},
            {
                onSuccess: () => {
                    toast.success('Kas masuk berhasil diposting ke jurnal');
                    closeConfirmModal();
                },
                onError: (errors: Record<string, string>) => {
                    const message = errors.msg || 'Gagal memposting kas masuk';
                    toast.error(message);
                    closeConfirmModal();
                },
            },
        );
    };

    const handleReverse = () => {
        router.post(
            `/cash-ins/${cashIn.id}/reverse`,
            {},
            {
                onSuccess: () => {
                    toast.success('Kas masuk berhasil di-reverse');
                    closeConfirmModal();
                },
                onError: () => {
                    toast.error('Gagal reverse kas masuk');
                    closeConfirmModal();
                },
            },
        );
    };

    const handleEdit = () => {
        router.visit(edit(cashIn.id!).url);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Kas Masuk ${cashIn.cash_in_number}`} />

                <div className="mb-2 flex items-center justify-between">
                    <div>
                        <div className="flex flex-row items-center gap-2">
                            <Link href={index().url}>
                                <ArrowLeft className="h-8 w-8" />
                            </Link>
                            <PageTitle
                                title={`Kas Masuk ${cashIn.cash_in_number}`}
                            />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge
                                className={cn(
                                    cashIn.status === 'posted'
                                        ? 'badge-green-light'
                                        : 'badge-yellow-light',
                                )}
                            >
                                {cashIn.status === 'posted'
                                    ? 'Posted'
                                    : 'Draft'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {cashIn.status === 'draft' && (
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
                        {cashIn.status === 'posted' && (
                            <Button
                                onClick={openConfirmModal}
                                className="btn-danger"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reverse
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card className="content">
                        <CardHeader>
                            <CardTitle>Informasi Kas Masuk</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Nomor:
                                </span>
                                <span className="font-medium">
                                    {cashIn.cash_in_number}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Tanggal:
                                </span>
                                <span className="font-medium">
                                    {formatDatetoString(
                                        new Date(cashIn.cash_in_date),
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Bank/Kas:
                                </span>
                                <span className="font-medium">
                                    {cashIn.bank?.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Akun Pendapatan:
                                </span>
                                <span className="font-medium">
                                    {cashIn.chart_of_account?.code || ''} -{' '}
                                    {cashIn.chart_of_account?.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Jumlah:
                                </span>
                                <span className="text-lg font-medium">
                                    {formatCurrency(cashIn.amount)}
                                </span>
                            </div>
                            {cashIn.description && (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">
                                        Keterangan:
                                    </span>
                                    <span className="mt-1 font-medium">
                                        {cashIn.description}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Modal
                    titleDesc={
                        cashIn.status === 'draft'
                            ? 'Post Kas Masuk?'
                            : 'Reverse Kas Masuk?'
                    }
                    contentDesc={
                        cashIn.status === 'draft'
                            ? 'Data akan diposting ke jurnal dan tidak bisa diedit lagi.'
                            : 'Jurnal akan dibalik dan data bisa diedit kembali.'
                    }
                    submitText={cashIn.status === 'draft' ? 'Post' : 'Reverse'}
                    isModalOpen={isConfirmModalOpen}
                    onModalClose={closeConfirmModal}
                    handleSubmit={
                        cashIn.status === 'draft' ? handlePost : handleReverse
                    }
                />
            </AppLayout>
        </>
    );
};

export default CashInShow;
