import PageTitle from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCell } from '@/components/ui/table';
import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { ReferenceType } from '@/constants/enum';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDatetoString, formatNumber } from '@/lib/utils';
import { index } from '@/routes/journal-entries';
import { BreadcrumbItem, JournalEntry } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    journalEntry: JournalEntry;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Akuntansi',
        href: '#',
    },
    {
        title: 'Jurnal',
        href: '/journal-entries',
    },
    {
        title: 'Detail',
        href: '#',
    },
];

const JournalEntryShow = ({ journalEntry }: PageProps) => {
    const formatStatus = (status: string) => {
        const statusMap: Record<
            string,
            { label: string; variant: 'default' | 'secondary' | 'destructive' }
        > = {
            posted: { label: 'Posted', variant: 'default' },
            draft: { label: 'Draft', variant: 'secondary' },
            reversed: { label: 'Reversed', variant: 'destructive' },
        };
        return statusMap[status] || { label: status, variant: 'secondary' };
    };

    const formatReferenceType = (type?: string) => {
        if (!type) return '-';
        const typeMap: Record<string, string> = {
            [ReferenceType.CASH_IN]: 'Kas Masuk',
            [ReferenceType.CASH_OUT]: 'Kas Keluar',
            [ReferenceType.SALE_PAYMENT]: 'Pembayaran Penjualan',
            [ReferenceType.PURCHASE_PAYMENT]: 'Pembayaran Pembelian',
            [ReferenceType.SALE]: 'Penjualan',
            [ReferenceType.PURCHASE]: 'Pembelian',
            [ReferenceType.SALE_RETURN]: 'Retur Penjualan',
            [ReferenceType.PURCHASE_RETURN]: 'Retur Pembelian',
            [ReferenceType.MANUAL]: 'Manual',
            [ReferenceType.STOCK_ADJUSTMENT]: 'Penyesuaian Stok',
        };
        return typeMap[type] || type;
    };

    const statusInfo = formatStatus(journalEntry.status);

    const tableColumn = ['Akun', 'Keterangan', 'Debit', 'Kredit'];

    console.log(journalEntry.details);
    const totalDebit =
        journalEntry.details?.reduce(
            (sum, detail) => sum + formatNumber(detail.debit) || 0,
            0,
        ) || 0;
    const totalCredit =
        journalEntry.details?.reduce(
            (sum, detail) => sum + (formatNumber(detail.credit) || 0),
            0,
        ) || 0;
    console.log(totalCredit);
    const difference = totalDebit - totalCredit;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Jurnal #${journalEntry.journal_number}`} />
            <div className="mb-4 flex items-center justify-between">
                <div className="flex flex-row items-center gap-2">
                    <Link href={index().url}>
                        <ArrowLeft className="h-8 w-8" />
                    </Link>
                    <PageTitle
                        title={`Jurnal #${journalEntry.journal_number}`}
                    />
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Jurnal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Nomor Jurnal
                            </p>
                            <p className="font-medium">
                                {journalEntry.journal_number}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Tanggal
                            </p>
                            <p className="font-medium">
                                {formatDatetoString(
                                    new Date(journalEntry.journal_date),
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Referensi
                            </p>
                            <p className="font-medium">
                                {formatReferenceType(
                                    journalEntry.reference_type,
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Status
                            </p>
                            <Badge variant={statusInfo.variant}>
                                {statusInfo.label}
                            </Badge>
                        </div>
                        {journalEntry.description && (
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Keterangan
                                </p>
                                <p className="font-medium">
                                    {journalEntry.description}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Total</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total Debit
                            </p>
                            <p className="text-lg font-medium">
                                {formatCurrency(totalDebit)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total Kredit
                            </p>
                            <p className="text-lg font-medium">
                                {formatCurrency(totalCredit)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Selisih
                            </p>
                            <p
                                className={`text-lg font-medium ${
                                    Math.abs(difference) < 0.01
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }`}
                            >
                                {formatCurrency(difference)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detail Jurnal</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="input-box overflow-x-auto rounded-lg">
                        <TableLayout
                            tableColumn={tableColumn}
                            tableRow={journalEntry.details || []}
                            pageFrom={1}
                            renderRow={(detail) => (
                                <>
                                    <TableCell className="flex w-full items-center justify-center text-center">
                                        {detail.chart_of_account?.code || ''} -{' '}
                                        {detail.chart_of_account?.name || '-'}
                                    </TableCell>
                                    <TableCell className="flex w-full items-center justify-center text-center">
                                        {detail.description || '-'}
                                    </TableCell>
                                    <TableCell className="flex w-full items-center justify-center text-center">
                                        {detail.debit > 0
                                            ? formatCurrency(detail.debit)
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="flex w-full items-center justify-center text-center">
                                        {detail.credit > 0
                                            ? formatCurrency(detail.credit)
                                            : '-'}
                                    </TableCell>
                                </>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
};

export default JournalEntryShow;
