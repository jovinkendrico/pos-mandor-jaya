import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import SalePaymentTable from '@/components/transaction/sale-payments/sale-payment-table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/sale-payments';
import { BreadcrumbItem, Bank, Customer, SalePayment, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface PageProps {
    payments: PaginatedData<SalePayment>;
    banks?: Bank[];
    customers?: Customer[];
    filters?: {
        search: string;
        date_from: string;
        date_to: string;
        status: string;
        bank_id: string;
        payment_method: string;
        customer_id: string;
        sort_by: string;
        sort_order: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Pembayaran Penjualan',
        href: '/sale-payments',
    },
];

export default function SalePaymentIndex({
    payments,
    banks = [],
    customers = [],
    filters = {
        search: '',
        date_from: '',
        date_to: '',
        status: 'all',
        bank_id: '',
        payment_method: 'all',
        customer_id: '',
        sort_by: 'payment_date',
        sort_order: 'desc',
    },
}: PageProps) {
    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        filters,
    );

    const handleCreate = () => {
        router.visit('/sale-payments/create');
    };

    const handleView = (payment: SalePayment) => {
        router.visit(`/sale-payments/${payment.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pembayaran Penjualan" />
            <div className="flex justify-between">
                <PageTitle title="Pembayaran Penjualan" />
                <Button onClick={handleCreate} className="btn-primary">
                    <Plus />
                    Tambah Pembayaran
                </Button>
            </div>
            <FilterBar
                filters={{ ...allFilters, search: searchTerm }}
                onFilterChange={handleFilterChange}
                showPaymentStatus={false}
                sortOptions={[
                    { value: 'payment_date', label: 'Tanggal' },
                    { value: 'payment_number', label: 'No. Pembayaran' },
                    { value: 'total_amount', label: 'Jumlah' },
                    { value: 'status', label: 'Status' },
                ]}
                statusOptions={[
                    { value: 'all', label: 'Semua Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                ]}
            />
            <Card className="content mt-4 p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="w-[180px]">
                        <Label htmlFor="bank_id">Bank/Kas</Label>
                        <Select
                            value={allFilters.bank_id || undefined}
                            onValueChange={(value) =>
                                handleFilterChange({ bank_id: value || '' })
                            }
                        >
                            <SelectTrigger id="bank_id" className="combobox">
                                <SelectValue placeholder="Semua Bank" />
                            </SelectTrigger>
                            <SelectContent>
                                {banks.map((bank) => (
                                    <SelectItem
                                        key={bank.id}
                                        value={bank.id.toString()}
                                    >
                                        {bank.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-[180px]">
                        <Label htmlFor="payment_method">Metode Pembayaran</Label>
                        <Select
                            value={allFilters.payment_method || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange({ payment_method: value })
                            }
                        >
                            <SelectTrigger
                                id="payment_method"
                                className="combobox"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="cash">Tunai</SelectItem>
                                <SelectItem value="transfer">Transfer</SelectItem>
                                <SelectItem value="giro">Giro</SelectItem>
                                <SelectItem value="cek">Cek</SelectItem>
                                <SelectItem value="other">Lainnya</SelectItem>
                                <SelectItem value="refund">Refund</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-[180px]">
                        <Label htmlFor="customer_id">Customer</Label>
                        <Select
                            value={allFilters.customer_id || undefined}
                            onValueChange={(value) =>
                                handleFilterChange({ customer_id: value || '' })
                            }
                        >
                            <SelectTrigger id="customer_id" className="combobox">
                                <SelectValue placeholder="Semua Customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((customer) => (
                                    <SelectItem
                                        key={customer.id}
                                        value={customer.id.toString()}
                                    >
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>
            <div className="mt-4">
                <SalePaymentTable payments={payments.data} onView={handleView} />
            </div>
            {payments.data.length !== 0 && (
                <TablePagination data={payments} />
            )}
        </AppLayout>
    );
}

