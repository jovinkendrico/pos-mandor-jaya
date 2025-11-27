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
import { formatNumberWithSeparator, parseStringtoNumber } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { AlertTriangle, Minus, Plus, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StockItem {
    item_id: number;
    item_code: string;
    item_name: string;
    stock: number;
    unit: string;
}

interface PageProps {
    minStockThreshold: number;
    maxStockThreshold: number;
    summary: {
        total_items: number;
        items_with_stock: number;
        items_without_stock: number;
        low_stock_count: number;
        high_stock_count: number;
        zero_stock_count: number;
        min_stock_threshold: number;
        max_stock_threshold: number;
    };
    lowStockItems: StockItem[];
    highStockItems: StockItem[];
    zeroStockItems: StockItem[];
    filters?: {
        min_stock: string;
        max_stock: string;
    };
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan Stok Minimum/Maksimum', href: '#' },
];

const StockFilterInput = ({
    value,
    onChange,
    label,
    id,
}: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    id: string;
}) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        const num = parseStringtoNumber(value);
        setLocalValue(num !== null ? formatNumberWithSeparator(num) : '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const numericString = rawValue.replace(/[^0-9]/g, '');

        if (numericString === '') {
            setLocalValue('');
            return;
        }

        const num = parseInt(numericString, 10);
        const formatted = formatNumberWithSeparator(num);
        setLocalValue(formatted);
    };

    const handleBlur = () => {
        const num = parseStringtoNumber(localValue);
        if (num !== null) {
            const formatted = formatNumberWithSeparator(num);
            setLocalValue(formatted);
            onChange(num.toString());
        } else {
            onChange('');
        }
    };

    const handleIncrement = () => {
        const num = parseStringtoNumber(localValue) || 0;
        const newVal = num + 1;
        onChange(newVal.toString());
    };

    const handleDecrement = () => {
        const num = parseStringtoNumber(localValue) || 0;
        const newVal = Math.max(0, num - 1);
        onChange(newVal.toString());
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDecrement}
                    className="btn-secondary h-9 w-9 shrink-0 cursor-pointer"
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <Input
                    id={id}
                    value={localValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="input-box text-center"
                    placeholder="0"
                />
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleIncrement}
                    className="btn-secondary h-9 w-9 shrink-0 cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default function StockMinMaxIndex({
    minStockThreshold,
    maxStockThreshold,
    summary,
    lowStockItems,
    highStockItems,
    zeroStockItems,
    filters = { min_stock: '', max_stock: '' },
}: PageProps) {
    const { allFilters, handleFilterChange } = useResourceFilters(
        () => ({ url: '/reports/stock-min-max' }),
        {
            search: '',
            status: 'all',
            date_from: '',
            date_to: '',
            sort_by: 'created_at',
            sort_order: 'desc',
            min_stock: filters.min_stock || minStockThreshold.toString(),
            max_stock: filters.max_stock || maxStockThreshold.toString(),
        },
    );

    const defaultFilters = {
        min_stock: '10',
        max_stock: '1000',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Stok Minimum/Maksimum" />
            <div className="mb-4 flex items-center justify-between">
                <PageTitle title="Laporan Stok Minimum/Maksimum" />
            </div>

            <FilterBar
                filters={allFilters}
                onFilterChange={handleFilterChange}
                defaultFilters={defaultFilters}
                showDateRange={false}
                showSearch={false}
                showStatus={false}
                showPaymentStatus={false}
                showSort={false}
                additionalFilters={
                    <>
                        <StockFilterInput
                            id="min_stock"
                            label="Jumlah Stok Mulai Dari"
                            value={allFilters.min_stock || ''}
                            onChange={(value) =>
                                handleFilterChange({ min_stock: value })
                            }
                        />
                        <StockFilterInput
                            id="max_stock"
                            label="Jumlah Stok Hingga"
                            value={allFilters.max_stock || ''}
                            onChange={(value) =>
                                handleFilterChange({ max_stock: value })
                            }
                        />
                    </>
                }
            />

            {/* Summary Cards */}
            <div className="mt-4 mb-4 grid gap-4 md:grid-cols-5">
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
                            Semua item
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Dengan Stok
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {summary.items_with_stock}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Item tersedia
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tanpa Stok
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {summary.zero_stock_count}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Habis
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Stok Rendah
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {summary.low_stock_count}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            ≤ {summary.min_stock_threshold}
                        </p>
                    </CardContent>
                </Card>
                <Card className="content">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Stok Tinggi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {summary.high_stock_count}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {'>'} {summary.max_stock_threshold}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Zero Stock Items */}
            {zeroStockItems.length > 0 && (
                <Card className="content mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Item Tanpa Stok ({zeroStockItems.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center">
                                            Kode
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Nama Barang
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Stok
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Unit
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {zeroStockItems.map((item) => (
                                        <TableRow
                                            key={item.item_id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-mono">
                                                {item.item_code}
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {item.item_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className="badge-red-light">
                                                    {formatNumberWithSeparator(
                                                        item.stock,
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.unit}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Low Stock Items */}
            {lowStockItems.length > 0 && (
                <Card className="content mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-amber-500" />
                            Item Stok Rendah (≤ {summary.min_stock_threshold}) (
                            {lowStockItems.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center">
                                            Kode
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Nama Barang
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Stok
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Unit
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lowStockItems.map((item) => (
                                        <TableRow
                                            key={item.item_id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-mono">
                                                {item.item_code}
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {item.item_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className="badge-yellow-light">
                                                    {formatNumberWithSeparator(
                                                        item.stock,
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.unit}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* High Stock Items */}
            {highStockItems.length > 0 && (
                <Card className="content">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                            Item Stok Tinggi ({'>'}{' '}
                            {summary.max_stock_threshold}) (
                            {highStockItems.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="text-center">
                                            Kode
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Nama Barang
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Stok
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Unit
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {highStockItems.map((item) => (
                                        <TableRow
                                            key={item.item_id}
                                            className="dark:border-b-2 dark:border-white/25"
                                        >
                                            <TableCell className="text-center font-mono">
                                                {item.item_code}
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {item.item_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className="badge-blue-light">
                                                    {formatNumberWithSeparator(
                                                        item.stock,
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.unit}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {zeroStockItems.length === 0 &&
                lowStockItems.length === 0 &&
                highStockItems.length === 0 && (
                    <Card className="content">
                        <CardContent className="py-8">
                            <p className="text-center text-muted-foreground">
                                Tidak ada item yang sesuai dengan kriteria
                                filter
                            </p>
                        </CardContent>
                    </Card>
                )}
        </AppLayout>
    );
}
