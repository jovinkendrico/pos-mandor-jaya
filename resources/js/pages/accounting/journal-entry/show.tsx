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
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { BreadcrumbItem, JournalEntry } from '@/types';
import { Head, router } from '@inertiajs/react';
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

export default function JournalEntryShow({ journalEntry }: PageProps) {
    const formatStatus = (status: string) => {
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
            posted: { label: 'Posted', variant: 'default' },
            draft: { label: 'Draft', variant: 'secondary' },
            reversed: { label: 'Reversed', variant: 'destructive' },
        };
        return statusMap[status] || { label: status, variant: 'secondary' };
    };

    const formatReferenceType = (type?: string) => {
        if (!type) return '-';
        const typeMap: Record<string, string> = {
            CashIn: 'Kas Masuk',
            CashOut: 'Kas Keluar',
            SalePayment: 'Pembayaran Penjualan',
            PurchasePayment: 'Pembayaran Pembelian',
            Sale: 'Penjualan',
            Purchase: 'Pembelian',
            SaleReturn: 'Retur Penjualan',
            PurchaseReturn: 'Retur Pembelian',
            Manual: 'Manual',
        };
        return typeMap[type] || type;
    };

    const statusInfo = formatStatus(journalEntry.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Jurnal #${journalEntry.journal_number}`} />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title={`Jurnal #${journalEntry.journal_number}`} />
                <Button
                    variant="outline"
                    onClick={() => router.visit('/journal-entries')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                {formatReferenceType(journalEntry.reference_type)}
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
                            <p className="font-medium text-lg">
                                {formatCurrency(journalEntry.total_debit || 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total Kredit
                            </p>
                            <p className="font-medium text-lg">
                                {formatCurrency(journalEntry.total_credit || 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Selisih
                            </p>
                            <p
                                className={`font-medium text-lg ${
                                    Math.abs(
                                        (journalEntry.total_debit || 0) -
                                            (journalEntry.total_credit || 0),
                                    ) < 0.01
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }`}
                            >
                                {formatCurrency(
                                    (journalEntry.total_debit || 0) -
                                        (journalEntry.total_credit || 0),
                                )}
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
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Akun</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="text-right">Debit</TableHead>
                                    <TableHead className="text-right">Kredit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {journalEntry.details && journalEntry.details.length > 0 ? (
                                    journalEntry.details.map((detail) => (
                                        <TableRow key={detail.id}>
                                            <TableCell>
                                                {detail.chart_of_account?.code || ''} -{' '}
                                                {detail.chart_of_account?.name || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {detail.description || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {detail.debit > 0
                                                    ? formatCurrency(detail.debit)
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {detail.credit > 0
                                                    ? formatCurrency(detail.credit)
                                                    : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-center text-muted-foreground"
                                        >
                                            Tidak ada detail jurnal
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

