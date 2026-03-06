import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Member {
    id: number;
    name: string;
    phone_number?: string;
    notes?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Master', href: '#' },
    { title: 'Anggota', href: '/members' },
    { title: 'Edit', href: '#' },
];

export default function MemberEdit({ member }: { member: Member }) {
    const { data, setData, put, processing, errors } = useForm({
        name: member.name,
        phone_number: member.phone_number ?? '',
        notes: member.notes ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/members/${member.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Anggota" />
            <PageTitle title={`Edit Anggota: ${member.name}`} />

            <div className="mt-4 max-w-md rounded-lg border bg-card p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Nama <span className="text-destructive">*</span></Label>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1" />
                        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <Label>No. HP</Label>
                        <Input value={data.phone_number} onChange={(e) => setData('phone_number', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <Label>Catatan</Label>
                        <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="mt-1" />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button type="submit" disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan'}</Button>
                        <Button type="button" variant="outline" onClick={() => router.visit('/members')}>Batal</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
