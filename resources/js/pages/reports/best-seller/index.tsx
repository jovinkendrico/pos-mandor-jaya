import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatNumberWithSeparator } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { Printer, Trophy } from 'lucide-react';

interface PageProps {
    dateFrom: string;
    dateTo: string;
    sortBy: string;
    limit: number;
    summary: {
        total_items: number;
        total_quantity: number;
        total_revenue: number;
        total_profit: number;
        profit_margin: number;
    };
    bestSellers: Array<{
        rank: number;
        item_id: number;
        item_code: string;
        item_name: string;
        total_quantity: number;
        transaction_count: number;
        total_revenue: number;
        total_cost: number;
        total_profit: number;
        avg_price: number;
        avg_cost: number;
        profit_margin: number;
    }>;
    trendData: Array<{
        item_id: number;
        item_code: string;
        item_name: string;
        daily_data: Array<{
            date: string;
            quantity: number;
            revenue: number;
        }>;
    }>;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports' },
    { title: 'Laporan Barang Paling Laku', href: '#' },
];

export default function BestSellerReportIndex({
    dateFrom,
    dateTo,
    sortBy,
    limit,
    summary,
    bestSellers,
}: PageProps) {
    const bestSellerRoute = () => ({ url: '/reports/best-seller' });

    const { allFilters, handleFilterChange } = useResourceFilters(
        bestSellerRoute,
        {
            search: '',
            status: 'all',
            date_from: dateFrom,
            date_to: dateTo,
            sort_by: sortBy,
            sort_order: 'desc',
            limit: limit.toString(),
        },
    );

    const getRankBadge = (rank: number) => {
        if (rank === 1)
            return (
                <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                    🥇 1
                </Badge>
            );
        if (rank === 2)
            return (
                <Badge className="bg-gray-400 text-white hover:bg-gray-500">
                    🥈 2
                </Badge>
            );
        if (rank === 3)
            return (
                <Badge className="bg-orange-600 text-white hover:bg-orange-700">
                    🥉 3
                </Badge>
            );
        return <Badge variant="outline">{rank}</Badge>;
    };

    const sortOptions = [
        { value: 'quantity', label: 'Quantity' },
        { value: 'revenue', label: 'Revenue' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Barang Paling Laku" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Barang Paling Laku (Best Seller)" />
            </div>

            <FilterBar
                filters={allFilters}
                onFilterChange={handleFilterChange}
                showDateRange={true}
                showSearch={false}
                showStatus={false}
                showPaymentStatus={false}
                showSort={true}
                sortOptions={sortOptions}
            >
                <div className="w-[120px]">
                    <Label htmlFor="limit">Jumlah Item</Label>
                    <Input
                        id="limit"
                        type="text"
                        value={formatNumberWithSeparator(
                            parseInt(allFilters.limit ?? '0'),
                        )}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            handleFilterChange({ limit: value });
                        }}
                        className="input-box text-center"
                    />
                </div>
            </FilterBar>

            <div className="flex w-full justify-end">
                <Button
                    onClick={() => {
                        const params = new URLSearchParams({
                            date_from: allFilters.date_from,
                            date_to: allFilters.date_to,
                            sort_by: allFilters.sort_by,
                            limit: (allFilters.limit ?? '10').toString(),
                        });
                        window.open(
                            `/reports/best-seller/print?${params.toString()}`,
                            '_blank',
                        );
                    }}
                    variant="outline"
                    className="btn-primary"
                >
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak PDF
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="mb-4 grid gap-4 md:grid-cols-4">
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Item
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_items}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Item terlaris
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Quantity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_quantity.toLocaleString('id-ID')}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Unit terjual
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_revenue)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Pendapatan
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Profit
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-emerald-500">
                            {formatCurrency(summary.total_profit)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Margin: {summary.profit_margin.toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Best Sellers Table */}
            <Card className="content">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Ranking Barang Paling Laku
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Periode: {format(new Date(dateFrom), 'dd MMM yyyy')} -{' '}
                        {format(new Date(dateTo), 'dd MMM yyyy')}
                        {' | '}Diurutkan berdasarkan:{' '}
                        {allFilters.sort_by === 'quantity'
                            ? 'Quantity'
                            : 'Revenue'}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="input-box overflow-x-auto rounded-lg">
                        <Table className="content">
                            <TableHeader>
                                <TableRow className="dark:border-b-2 dark:border-white/25">
                                    <TableHead
                                        className="text-center"
                                        style={{ width: '5%' }}
                                    >
                                        Rank
                                    </TableHead>
                                    <TableHead
                                        className="text-center"
                                        style={{ width: '12%' }}
                                    >
                                        Kode
                                    </TableHead>
                                    <TableHead
                                        className="text-center"
                                        style={{ width: '25%' }}
                                    >
                                        Nama Barang
                                    </TableHead>
                                    <TableHead
                                        className="text-center"
                                        style={{ width: '10%' }}
                                    >
                                        Quantity
                                    </TableHead>
                                    <TableHead
                                        className="text-center"
                                        style={{ width: '8%' }}
                                    >
                                        Transaksi
                                    </TableHead>
                                    <TableHead
                                        className="text-center"
                                        style={{ width: '12%' }}
                                    >
                                        Revenue
                                    </TableHead>
                                    <TableHead
                                        className="text-center"
                                        style={{ width: '12%' }}
                                    >
                                        Cost
                                    </TableHead>
                                    <TableHead
                                        className="text-center"
                                        style={{ width: '12%' }}
                                    >
                                        Profit
                                    </TableHead>
                                    <TableHead
                                        className="text-center"
                                        style={{ width: '8%' }}
                                    >
                                        Margin
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bestSellers.length > 0 ? (
                                    bestSellers.map((item) => (
                                        <TableRow
                                            key={item.item_id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center">
                                                {getRankBadge(item.rank)}
                                            </TableCell>
                                            <TableCell className="text-center font-mono">
                                                {item.item_code}
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {item.item_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.total_quantity.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.transaction_count}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    item.total_revenue,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(
                                                    item.total_cost,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold text-green-600 dark:text-emerald-500">
                                                {formatCurrency(
                                                    item.total_profit,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.profit_margin.toFixed(2)}%
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableCell
                                            colSpan={9}
                                            className="text-center text-muted-foreground"
                                        >
                                            Tidak ada data
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
