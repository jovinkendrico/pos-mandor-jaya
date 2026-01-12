import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDatetoString } from '@/lib/utils';
import { DatePicker } from '@/components/date-picker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Search, Printer, AlertCircle, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { qzPrintService } from '@/lib/qz-print-service';
import { toast } from 'sonner';

interface Sale {
    id: number;
    sale_number: string;
    sale_date: string;
    due_date: string | null;
    customer_id: number | null;
    customer_name: string;
    customer_address: string | null;
    total_amount: number;
    total_paid: number;
    remaining_amount: number;
    is_overdue: boolean;
    days_overdue: number;
}

interface Customer {
    id: number;
    name: string;
}

interface PageProps {
    sales: Sale[];
    customers: Customer[];
    filters: {
        search: string;
        customer_id: string;
        date_from: string;
        date_to: string;
        overdue_only: boolean;
    };
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Tanda Terima Faktur', href: '#' },
];

export default function PaymentReceiptIndex({ sales, customers, filters: initialFilters }: PageProps) {
    const [selectedSales, setSelectedSales] = useState<number[]>([]);
    const [filters, setFilters] = useState(initialFilters);

    const handleFilter = () => {
        router.get('/payment-receipt', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        const resetFilters = {
            search: '',
            customer_id: '',
            date_from: '',
            date_to: '',
            overdue_only: false,
        };
        setFilters(resetFilters);
        router.get('/payment-receipt', resetFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleFilter();
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedSales(sales.map(sale => sale.id));
        } else {
            setSelectedSales([]);
        }
    };

    const handleSelectSale = (saleId: number, checked: boolean) => {
        if (checked) {
            setSelectedSales([...selectedSales, saleId]);
        } else {
            setSelectedSales(selectedSales.filter(id => id !== saleId));
        }
    };

    const handlePrint = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (selectedSales.length === 0) {
            toast.error('Pilih minimal satu faktur untuk dicetak.');
            return;
        }

        // Get printer name from localStorage or prompt user
        let printerName = localStorage.getItem('qz_printer_name');

        // Allow user to change printer by holding Shift key
        if (e.shiftKey) {
            printerName = null;
        }

        if (!printerName) {
            printerName = window.prompt(
                'Masukkan Nama Printer Dot Matrix (cek di Control Panel):',
                'EPSON LX-310 ESC/P (Copy 1)'
            );
            if (!printerName) return;
            localStorage.setItem('qz_printer_name', printerName);
        }

        try {
            // Group selected sales by customer
            const selectedSalesData = sales.filter(sale => selectedSales.includes(sale.id));
            const groupedByCustomer = selectedSalesData.reduce((acc, sale) => {
                const customerId = sale.customer_id || 0;
                if (!acc[customerId]) {
                    acc[customerId] = [];
                }
                acc[customerId].push(sale);
                return acc;
            }, {} as Record<number, Sale[]>);

            // Print each customer's receipt
            let receiptNumber = 1;
            for (const customerSales of Object.values(groupedByCustomer)) {
                const invoices = customerSales.map(sale => ({
                    date: formatDatetoString(new Date(sale.sale_date)),
                    number: sale.sale_number,
                    amount: sale.remaining_amount,
                    due_date: sale.due_date ? formatDatetoString(new Date(sale.due_date)) : '-',
                }));

                const total = customerSales.reduce((sum, sale) => sum + sale.remaining_amount, 0);

                await qzPrintService.printPaymentReceipt(
                    {
                        receipt_number: `NO.TTA-${String(receiptNumber).padStart(4, '0')}`,
                        customer_name: customerSales[0].customer_name,
                        invoices,
                        total,
                    },
                    printerName
                );

                receiptNumber++;
            }

            toast.success(`Berhasil mencetak ${Object.keys(groupedByCustomer).length} tanda terima.`);
        } catch (error) {
            console.error('Print error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal mencetak. Pastikan QZ Tray sudah berjalan.';
            toast.error(errorMessage);

            // Clear printer name on error to let user re-enter if it was wrong
            if (errorMessage.includes('not find') || errorMessage.includes('tidak ditemukan')) {
                localStorage.removeItem('qz_printer_name');
            }
        }
    };

    const selectedTotal = sales
        .filter(sale => selectedSales.includes(sale.id))
        .reduce((sum, sale) => sum + sale.remaining_amount, 0);

    const overdueCount = sales.filter(sale => sale.is_overdue).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tanda Terima Faktur" />
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Tanda Terima Faktur" />
                <Button
                    onClick={handlePrint}
                    className="btn-primary"
                    disabled={selectedSales.length === 0}
                >
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak ({selectedSales.length})
                </Button>
            </div>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="search">Cari</Label>
                            <Input
                                id="search"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="No. Faktur atau Nama Customer"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer_id">Customer</Label>
                            <Select
                                value={filters.customer_id || 'all'}
                                onValueChange={(value) => setFilters({ ...filters, customer_id: value === 'all' ? '' : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Customer</SelectItem>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {customer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date_from">Dari Tanggal</Label>
                            <DatePicker
                                value={filters.date_from ? new Date(filters.date_from) : undefined}
                                onChange={(date) =>
                                    setFilters({
                                        ...filters,
                                        date_from: date ? format(date, 'yyyy-MM-dd') : '',
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date_to">Sampai Tanggal</Label>
                            <DatePicker
                                value={filters.date_to ? new Date(filters.date_to) : undefined}
                                onChange={(date) =>
                                    setFilters({
                                        ...filters,
                                        date_to: date ? format(date, 'yyyy-MM-dd') : '',
                                    })
                                }
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="overdue_only"
                                checked={filters.overdue_only}
                                onCheckedChange={(checked) =>
                                    setFilters({ ...filters, overdue_only: checked === true })
                                }
                            />
                            <Label htmlFor="overdue_only" className="cursor-pointer">
                                Hanya Jatuh Tempo
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                type="button"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                            <Button onClick={handleFilter} className="btn-primary">
                                <Search className="mr-2 h-4 w-4" />
                                Tampilkan
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedSales.length > 0 && (
                <Card className="mb-4 bg-blue-50 dark:bg-blue-950">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {selectedSales.length} faktur dipilih
                                </p>
                                <p className="text-lg font-semibold">
                                    Total Tagihan: {formatCurrency(selectedTotal)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {overdueCount > 0 && (
                <Card className="mb-4 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                            <p className="text-sm">
                                <strong>{overdueCount}</strong> faktur sudah jatuh tempo
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Faktur Belum Lunas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedSales.length === sales.length && sales.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>No. Faktur</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Jatuh Tempo</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Terbayar</TableHead>
                                    <TableHead className="text-right">Sisa</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.length > 0 ? (
                                    sales.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedSales.includes(sale.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleSelectSale(sale.id, checked === true)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="font-mono font-medium">
                                                {sale.sale_number}
                                            </TableCell>
                                            <TableCell>{sale.customer_name}</TableCell>
                                            <TableCell>
                                                {formatDatetoString(new Date(sale.sale_date))}
                                            </TableCell>
                                            <TableCell>
                                                {sale.due_date ? (
                                                    <span className={sale.is_overdue ? 'text-red-600 font-medium' : ''}>
                                                        {formatDatetoString(new Date(sale.due_date))}
                                                        {sale.is_overdue && (
                                                            <Badge variant="destructive" className="ml-2">
                                                                {sale.days_overdue} hari
                                                            </Badge>
                                                        )}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(sale.total_amount)}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {formatCurrency(sale.total_paid)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-orange-600">
                                                {formatCurrency(sale.remaining_amount)}
                                            </TableCell>
                                            <TableCell>
                                                {sale.is_overdue ? (
                                                    <Badge variant="destructive">Jatuh Tempo</Badge>
                                                ) : (
                                                    <Badge variant="warning">Belum Lunas</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                                            Tidak ada faktur yang belum lunas
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

