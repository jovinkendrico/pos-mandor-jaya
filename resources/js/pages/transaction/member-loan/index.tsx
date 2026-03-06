import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { BreadcrumbItem, PaginatedData } from '@/types';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import { Plus, Eye, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MemberLoan {
    id: number;
    loan_number: string;
    loan_date: string;
    amount: number;
    status: 'pending' | 'confirmed';
    is_opening_balance: boolean;
    total_paid: number;
    remaining_amount: number;
    member: { id: number; name: string };
    bank?: { id: number; name: string };
}

interface PageProps {
    loans: PaginatedData<MemberLoan>;
    members: { id: number; name: string }[];
    filters: { search: string; status: string; member_id: string; date_from: string; date_to: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Transaksi', href: '#' },
    { title: 'Pinjaman Anggota', href: '/member-loans' },
];

const statusBadge = (status: string) => {
    if (status === 'confirmed') return <Badge className="bg-green-100 text-green-700 border-green-300">Dikonfirmasi</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
};

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export default function MemberLoanIndex({ loans, members, filters }: PageProps) {
    const { flash } = usePage<any>().props;
    const [search, setSearch] = useState(filters.search || '');

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const applyFilter = (extra: Record<string, string> = {}) => {
        router.get('/member-loans', { ...filters, search, ...extra }, { preserveState: true });
    };

    const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') applyFilter();
    };

    const memberOptions = [
        { value: '', label: 'Semua Anggota' },
        ...members.map((m) => ({ value: m.id.toString(), label: m.name })),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pinjaman Anggota" />
            <div className="flex items-center justify-between">
                <PageTitle title="Pinjaman Anggota" />
                <Button onClick={() => router.visit('/member-loans/create')}>
                    <Plus className="mr-1 h-4 w-4" />
                    Tambah Pinjaman
                </Button>
            </div>

            {/* Filters */}
            <div className="mt-4 flex flex-wrap gap-3">
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKey}
                    placeholder="Cari no. pinjaman / nama anggota..."
                    className="w-64"
                />
                <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={filters.status}
                    onChange={(e) => applyFilter({ status: e.target.value })}
                >
                    <option value="all">Semua Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Dikonfirmasi</option>
                </select>
                <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={filters.member_id}
                    onChange={(e) => applyFilter({ member_id: e.target.value })}
                >
                    {memberOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <Button variant="outline" onClick={() => applyFilter()}>Cari</Button>
                <Button
                    variant="ghost"
                    onClick={() => {
                        setSearch('');
                        router.visit('/member-loans');
                    }}
                >Reset</Button>
            </div>

            {/* Table */}
            <div className="mt-4 rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>No. Pinjaman</TableHead>
                            <TableHead>Anggota</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                            <TableHead className="text-right">Terbayar</TableHead>
                            <TableHead className="text-right">Sisa</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loans.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                                    Tidak ada data pinjaman
                                </TableCell>
                            </TableRow>
                        )}
                        {loans.data.map((loan, idx) => (
                            <TableRow key={loan.id}>
                                <TableCell>{(loans.from ?? 0) + idx}</TableCell>
                                <TableCell className="font-mono font-medium">
                                    {loan.loan_number}
                                    {loan.is_opening_balance && (
                                        <Badge variant="outline" className="ml-1 text-xs">Saldo Awal</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{loan.member?.name}</TableCell>
                                <TableCell>{loan.loan_date}</TableCell>
                                <TableCell className="text-right">Rp {fmt(loan.amount)}</TableCell>
                                <TableCell className="text-right text-green-600">Rp {fmt(loan.total_paid)}</TableCell>
                                <TableCell className={`text-right font-medium ${loan.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    Rp {fmt(loan.remaining_amount)}
                                </TableCell>
                                <TableCell>{statusBadge(loan.status)}</TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" onClick={() => router.visit(`/member-loans/${loan.id}`)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {loan.status === 'pending' && (
                                            <Button size="icon" variant="ghost" onClick={() => router.visit(`/member-loans/${loan.id}/edit`)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <TablePagination data={loans} />
        </AppLayout>
    );
}
