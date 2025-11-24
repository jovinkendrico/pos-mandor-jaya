import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/items';
import { BreadcrumbItem, IItem, PaginatedData } from '@/types';
import { formatDate, formatNumberWithSeparator } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface StockCardTransaction {
    id: number;
    date: string;
    reference_type: string;
    reference_id: number | null;
    notes: string | null;
    in: number;
    out: number;
    balance: number;
}

interface PageProps {
    item: IItem;
    transactions: PaginatedData<StockCardTransaction>;
    openingStock: number;
    closingStock: number;
    filters?: {
        date_from: string;
        date_to: string;
        reference_type: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'Barang',
        href: index().url,
    },
    {
        title: 'Kartu Stok',
        href: '#',
    },
];

const StockCardPage = (props: PageProps) => {
    const {
        item,
        transactions,
        openingStock,
        closingStock,
        filters = {
            date_from: '',
            date_to: '',
            reference_type: 'all',
        },
    } = props;

    const { allFilters, handleFilterChange } = useResourceFilters(
        () => ({ url: '', method: 'get' as const }),
        {
            ...filters,
            search: '',
            status: 'all',
        },
    );

    const getReferenceTypeLabel = (type: string) => {
        switch (type) {
            case 'Purchase':
                return 'Pembelian';
            case 'Sale':
                return 'Penjualan';
            case 'StockAdjustment':
                return 'Penyesuaian Stok';
            case 'OpeningBalance':
                return 'Saldo Awal';
            case 'PurchaseReturn':
                return 'Retur Pembelian';
            case 'SaleReturn':
                return 'Retur Penjualan';
            default:
                return type;
        }
    };

    const getReferenceTypeBadgeVariant = (type: string) => {
        switch (type) {
            case 'Purchase':
            case 'OpeningBalance':
            case 'PurchaseReturn':
                return 'default';
            case 'Sale':
            case 'SaleReturn':
                return 'destructive';
            case 'StockAdjustment':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const referenceTypes = [
        { value: 'all', label: 'Semua' },
        { value: 'Purchase', label: 'Pembelian' },
        { value: 'Sale', label: 'Penjualan' },
        { value: 'StockAdjustment', label: 'Penyesuaian Stok' },
        { value: 'OpeningBalance', label: 'Saldo Awal' },
        { value: 'PurchaseReturn', label: 'Retur Pembelian' },
        { value: 'SaleReturn', label: 'Retur Penjualan' },
    ];

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Kartu Stok - ${item.name}`} />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={index().url}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft />
                            </Button>
                        </Link>
                        <div>
                            <PageTitle title={`Kartu Stok - ${item.name}`} />
                            <p className="text-sm text-muted-foreground">
                                {item.code} - Stok: {formatNumberWithSeparator(item.stock)}
                            </p>
                        </div>
                    </div>
                </div>

                <Card className="content mt-4 p-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Stok Awal</p>
                            <p className="text-lg font-semibold">{formatNumberWithSeparator(openingStock)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Stok Akhir</p>
                            <p className="text-lg font-semibold">{formatNumberWithSeparator(closingStock)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Selisih</p>
                            <p className={`text-lg font-semibold ${closingStock - openingStock >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatNumberWithSeparator(closingStock - openingStock)}
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

                <Card className="content mt-4 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="w-[180px]">
                            <Label htmlFor="reference_type">Tipe Transaksi</Label>
                            <Select
                                value={allFilters.reference_type || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange({ reference_type: value })
                                }
                            >
                                <SelectTrigger id="reference_type" className="combobox">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {referenceTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                <Card className="content mt-4">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">Tanggal</TableHead>
                                    <TableHead className="text-center">Tipe</TableHead>
                                    <TableHead className="text-center">Keterangan</TableHead>
                                    <TableHead className="text-center">Masuk</TableHead>
                                    <TableHead className="text-center">Keluar</TableHead>
                                    <TableHead className="text-center">Saldo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data pergerakan stok
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {transactions.data.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell className="text-center">
                                                    {formatDate(transaction.date)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={getReferenceTypeBadgeVariant(transaction.reference_type)}>
                                                        {getReferenceTypeLabel(transaction.reference_type)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {transaction.notes || '-'}
                                                </TableCell>
                                                <TableCell className="text-center text-green-600">
                                                    {transaction.in > 0 ? formatNumberWithSeparator(transaction.in) : '-'}
                                                </TableCell>
                                                <TableCell className="text-center text-red-600">
                                                    {transaction.out > 0 ? formatNumberWithSeparator(transaction.out) : '-'}
                                                </TableCell>
                                                <TableCell className="text-center font-semibold">
                                                    {formatNumberWithSeparator(transaction.balance)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
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

export default StockCardPage;

