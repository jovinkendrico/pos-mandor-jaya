import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { BreadcrumbItem, PaginatedData } from '@/types';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Member {
    id: number;
    name: string;
    phone_number?: string;
    notes?: string;
    loans_count: number;
}

interface PageProps {
    members: PaginatedData<Member>;
    filters: { search: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Master', href: '#' },
    { title: 'Anggota', href: '/members' },
];

export default function MemberIndex({ members, filters }: PageProps) {
    const { flash } = usePage<any>().props;
    const [search, setSearch] = useState(filters.search || '');

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleSearch = () => {
        router.get('/members', { search }, { preserveState: true });
    };

    const handleDelete = (member: Member) => {
        if (member.loans_count > 0) {
            toast.error('Anggota tidak dapat dihapus karena memiliki data pinjaman.');
            return;
        }
        if (!confirm(`Hapus anggota "${member.name}"?`)) return;
        router.delete(`/members/${member.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Anggota" />
            <div className="flex items-center justify-between">
                <PageTitle title="Data Anggota" />
                <Button onClick={() => router.visit('/members/create')}>
                    <Plus className="mr-1 h-4 w-4" />Tambah Anggota
                </Button>
            </div>

            <div className="mt-4 flex gap-3">
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Cari nama / no. HP..."
                    className="w-64"
                />
                <Button variant="outline" onClick={handleSearch}>Cari</Button>
            </div>

            <div className="mt-4 rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>No. HP</TableHead>
                            <TableHead>Jml. Pinjaman</TableHead>
                            <TableHead>Catatan</TableHead>
                            <TableHead>Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                    Tidak ada data anggota
                                </TableCell>
                            </TableRow>
                        )}
                        {members.data.map((m, idx) => (
                            <TableRow key={m.id}>
                                <TableCell>{(members.from ?? 0) + idx}</TableCell>
                                <TableCell className="font-medium">{m.name}</TableCell>
                                <TableCell>{m.phone_number ?? '-'}</TableCell>
                                <TableCell>{m.loans_count}</TableCell>
                                <TableCell className="max-w-xs truncate">{m.notes ?? '-'}</TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" onClick={() => router.visit(`/members/${m.id}/edit`)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(m)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <TablePagination data={members} />
        </AppLayout>
    );
}
