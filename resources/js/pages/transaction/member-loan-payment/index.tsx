import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { BreadcrumbItem, PaginatedData } from '@/types';
import PageTitle from '@/components/page-title';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import { useState, useEffect } from 'react';
import useDebounce from '@/hooks/use-debounce';
import { Eye, Trash2 } from 'lucide-react';
import { usePermission } from '@/hooks/use-permission';

interface Payment {
    id: number;
    payment_number: string;
    payment_date: string;
    amount: number;
    status: 'pending' | 'confirmed';
    loan: { id: number; loan_number: string; member: { name: string } };
    bank?: { name: string };
}

interface PageProps {
    payments: PaginatedData<Payment>;
    filters: {
        search: string;
        status: string;
        date_from: string;
        date_to: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pembayaran', href: '#' },
    { title: 'Pembayaran Pinjaman Anggota', href: '/member-loan-payments' },
];

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(Math.round(n));

export default function MemberLoanPaymentIndex({ payments, filters }: PageProps) {
    const { hasPermission } = usePermission();

    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);

    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        router.get('/member-loan-payments', { search: debouncedSearch, status, date_from: dateFrom, date_to: dateTo }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [debouncedSearch, status, dateFrom, dateTo]);

    const handleClearFilters = () => {
        setSearch('');
        setStatus('all');
        setDateFrom('');
        setDateTo('');
    };

    const handleDelete = (payment: Payment) => {
        if (!confirm(`Hapus pembayaran ${payment.payment_number}?`)) return;
        router.delete(`/member-loan-payments/${payment.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pembayaran Pinjaman Anggota" />
            <PageTitle title="Pembayaran Pinjaman Anggota" />

            <div className="mt-4 rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Pencarian</label>
                        <Input
                            placeholder="Cari No. Pembayaran / Nama Anggota..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-48 space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Status</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full md:w-36 space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Dari Tanggal</label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div className="w-full md:w-36 space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Sampai Tanggal</label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                    <Button variant="outline" onClick={handleClearFilters}>
                        Reset
                    </Button>
                </div>

                <div className="mt-4 rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No. Pembayaran</TableHead>
                                <TableHead>No. Pinjaman</TableHead>
                                <TableHead>Anggota</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        Belum ada data pembayaran pinjaman.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.data.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-mono font-medium">{payment.payment_number}</TableCell>
                                        <TableCell className="font-mono text-muted-foreground">
                                            <button onClick={() => router.visit(`/member-loans/${payment.loan.id}`)} className="hover:underline">
                                                {payment.loan.loan_number}
                                            </button>
                                        </TableCell>
                                        <TableCell>{payment.loan.member.name}</TableCell>
                                        <TableCell>{payment.payment_date}</TableCell>
                                        <TableCell className="text-right">Rp {fmt(payment.amount)}</TableCell>
                                        <TableCell>
                                            {payment.status === 'confirmed' ? (
                                                <Badge className="bg-green-100 text-green-700">Dikonfirmasi</Badge>
                                            ) : (
                                                <Badge variant="secondary">Pending</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => router.visit(`/member-loans/${payment.loan.id}`)} title="Lihat Pinjaman">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {payment.status === 'pending' && hasPermission('member-loan-payments.delete') && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive border border-transparent hover:border-destructive" onClick={() => handleDelete(payment)} title="Hapus">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <TablePagination data={payments} />
            </div>
        </AppLayout>
    );
}
