import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { index } from '@/routes/banks';
import { BreadcrumbItem, IBank, PaginatedData } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface CashMovementTransaction {
    id: number;
    date: string;
    type: 'cash_in' | 'cash_out' | 'sale_payment' | 'purchase_payment' | 'draft_cash_in' | 'draft_cash_out' | 'transfer' | 'return' | 'bank' | 'other';
    reference_number: string;
    reference_type: string | null;
    description: string;
    debit: number;
    credit: number;
    balance_before: number;
    balance_after: number;
}

interface PageProps {
    bank: IBank;
    transactions: PaginatedData<CashMovementTransaction>;
    openingBalance: number;
    closingBalance: number;
    filters?: {
        date_from: string;
        date_to: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'Bank/Cash',
        href: index().url,
    },
    {
        title: 'Pergerakan Kas',
        href: '#',
    },
];

const CashMovementPage = (props: PageProps) => {
    const {
        bank,
        transactions,
        openingBalance,
        closingBalance,
        filters = {
            date_from: '',
            date_to: '',
        },
    } = props;

    const { allFilters, handleFilterChange } = useResourceFilters(
        () => ({ url: '', method: 'get' as const }),
        {
            ...filters,
            search: '',
            status: 'all',
            sort_by: 'date',
            sort_order: 'desc',
        },
    );

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'cash_in':
                return 'Kas Masuk';
            case 'cash_out':
                return 'Kas Keluar';
            case 'draft_cash_in':
                return '[DRAFT] Kas Masuk';
            case 'draft_cash_out':
                return '[DRAFT] Kas Keluar';
            case 'sale_payment':
            case 'purchase_payment':
            case 'payment':
                return 'Pembayaran';
            case 'transfer':
                return 'Transfer';
            case 'return':
            case 'sale_return':
            case 'purchase_return':
                return 'Retur';
            case 'bank':
                return 'Saldo/Bank';
            default:
                return type;
        }
    };

    const getTypeBadgeVariant = (type: string) => {
        if (type.startsWith('draft_')) return 'outline';

        switch (type) {
            case 'cash_in':
                return 'default';
            case 'cash_out':
                return 'destructive';
            case 'sale_payment':
            case 'purchase_payment':
            case 'payment':
                return 'outline';
            case 'transfer':
                return 'secondary';
            case 'bank':
                return 'default';
            default:
                return 'secondary';
        }
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Pergerakan Kas - ${bank.name}`} />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={index().url}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft />
                            </Button>
                        </Link>
                        <div>
                            <PageTitle
                                title={`Pergerakan Kas - ${bank.name}`}
                            />
                            <p className="text-sm text-muted-foreground">
                                {bank.type === 'bank' ? 'Bank' : 'Kas'} - Saldo:{' '}
                                {formatCurrency(bank.balance)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* <Card className="content mt-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex justify-between items-center md:block">
                            <p className="text-sm text-muted-foreground">
                                Saldo Awal
                            </p>
                            <p className="text-lg font-semibold">
                                {formatCurrency(openingBalance)}
                            </p>
                        </div>
                        <div className="flex justify-between items-center md:block">
                            <p className="text-sm text-muted-foreground">
                                Saldo Akhir
                            </p>
                            <p className="text-lg font-semibold">
                                {formatCurrency(closingBalance)}
                            </p>
                        </div>
                    </div>
                </Card> */}

                <FilterBar
                    filters={{ ...allFilters, search: '' }}
                    onFilterChange={handleFilterChange}
                    showPaymentStatus={false}
                    sortOptions={[]}
                    statusOptions={[]}
                />

                {/* Desktop Table View */}
                <Card className="content mt-4 hidden md:block">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">
                                        Tanggal
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Tipe
                                    </TableHead>
                                    <TableHead className="text-center">
                                        No. Referensi
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Keterangan
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Debit
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Kredit
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Saldo Sebelum
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Saldo Akhir
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada data pergerakan kas
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {transactions.data.map(
                                            (transaction) => (
                                                <TableRow
                                                    key={`${transaction.type}-${transaction.id}`}
                                                >
                                                    <TableCell className="text-center">
                                                        {formatDate(
                                                            new Date(
                                                                transaction.date,
                                                            ),
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            variant={getTypeBadgeVariant(
                                                                transaction.type,
                                                            )}
                                                        >
                                                            {getTypeLabel(
                                                                transaction.type,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono text-sm">
                                                        {
                                                            transaction.reference_number
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {
                                                            transaction.description
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-center text-green-600">
                                                        {transaction.debit > 0
                                                            ? formatCurrency(
                                                                transaction.debit,
                                                            )
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-center text-red-600">
                                                        {transaction.credit > 0
                                                            ? formatCurrency(
                                                                transaction.credit,
                                                            )
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {formatCurrency(
                                                            transaction.balance_before,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center font-semibold">
                                                        {formatCurrency(
                                                            transaction.balance_after,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Mobile Card View */}
                <div className="md:hidden mt-4 space-y-4">
                    {transactions.data.length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground">
                            Tidak ada data pergerakan kas
                        </Card>
                    ) : (
                        transactions.data.map((transaction) => (
                            <Card key={`${transaction.type}-${transaction.id}`} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            {formatDate(new Date(transaction.date))}
                                        </p>
                                        <p className="text-xs font-mono text-muted-foreground">
                                            {transaction.reference_number}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={getTypeBadgeVariant(transaction.type)}
                                        className="text-[10px] px-2 py-0 h-5"
                                    >
                                        {getTypeLabel(transaction.type)}
                                    </Badge>
                                </div>

                                <p className="text-sm">
                                    {transaction.description}
                                </p>

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                                    <div>
                                        <p className="text-muted-foreground">Debit</p>
                                        <p className="font-medium text-green-600">
                                            {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground">Kredit</p>
                                        <p className="font-medium text-red-600">
                                            {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                                        </p>
                                    </div>
                                    <div className="mt-1">
                                        <p className="text-muted-foreground">Sebelum</p>
                                        <p className="font-medium">
                                            {formatCurrency(transaction.balance_before)}
                                        </p>
                                    </div>
                                    <div className="text-right mt-1">
                                        <p className="text-muted-foreground font-semibold">Akhir</p>
                                        <p className="font-bold text-sm">
                                            {formatCurrency(transaction.balance_after)}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {transactions.data.length !== 0 && (
                    <TablePagination data={transactions} />
                )}
            </AppLayout>
        </>
    );
};

export default CashMovementPage;
