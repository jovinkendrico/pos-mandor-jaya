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
    type: 'cash_in' | 'cash_out' | 'sale_payment' | 'purchase_payment';
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
            default:
                return type;
        }
    };

    const getTypeBadgeVariant = (type: string) => {
        switch (type) {
            case 'cash_in':
                return 'default';
            case 'cash_out':
                return 'destructive';
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

                <Card className="content mt-4 p-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Saldo Awal
                            </p>
                            <p className="text-lg font-semibold">
                                {formatCurrency(openingBalance)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Saldo Akhir
                            </p>
                            <p className="text-lg font-semibold">
                                {formatCurrency(closingBalance)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Selisih
                            </p>
                            <p
                                className={`text-lg font-semibold ${closingBalance - openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                                {formatCurrency(
                                    closingBalance - openingBalance,
                                )}
                            </p>
                        </div>
                    </div>
                </Card>

                <FilterBar
                    filters={{ ...allFilters, search: '' }}
                    onFilterChange={handleFilterChange}
                    showPaymentStatus={false}
                    sortOptions={[]}
                    statusOptions={[]}
                />

                <Card className="content mt-4">
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

                {transactions.data.length !== 0 && (
                    <TablePagination data={transactions} />
                )}
            </AppLayout>
        </>
    );
};

export default CashMovementPage;
