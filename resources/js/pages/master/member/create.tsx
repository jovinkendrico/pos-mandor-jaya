import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Master', href: '#' },
    { title: 'Anggota', href: '/members' },
    { title: 'Tambah', href: '#' },
];

export default function MemberCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        phone_number: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/members');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Anggota" />
            <PageTitle title="Tambah Anggota" />

            <div className="mt-4 max-w-md rounded-lg border bg-card p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nama <span className="text-destructive">*</span></Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1" />
                        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <Label htmlFor="phone_number">No. HP</Label>
                        <Input id="phone_number" value={data.phone_number} onChange={(e) => setData('phone_number', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="notes">Catatan</Label>
                        <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="mt-1" />
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
