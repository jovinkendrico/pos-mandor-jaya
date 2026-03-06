import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Member {
    id: number;
    name: string;
    phone_number?: string;
}

interface PageProps {
    members: Member[];
    banks: { id: number; name: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Transaksi', href: '#' },
    { title: 'Pinjaman Anggota', href: '/member-loans' },
    { title: 'Tambah', href: '#' },
];

export default function MemberLoanCreate({ members, banks }: PageProps) {
    const { flash } = usePage<any>().props;

    useEffect(() => {
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const { data, setData, post, processing, errors } = useForm({
        member_id: '',
        loan_date: new Date().toISOString().slice(0, 10),
        amount: '',
        bank_id: '',
        notes: '',
    });

    const memberOptions = members.map((m) => ({ value: m.id.toString(), label: m.name }));
    const bankOptions = banks.map((b) => ({ value: b.id.toString(), label: b.name }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/member-loans');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Pinjaman Anggota" />
            <PageTitle title="Tambah Pinjaman Anggota" />

            <div className="mt-4 max-w-xl rounded-lg border bg-card p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="member_id">Anggota <span className="text-destructive">*</span></Label>
                        <Combobox
                            options={memberOptions}
                            value={data.member_id}
                            onValueChange={(v) => setData('member_id', v)}
                            placeholder="Pilih Anggota"
                            searchPlaceholder="Cari nama..."
                            className="mt-1"
                        />
                        {errors.member_id && <p className="text-sm text-destructive mt-1">{errors.member_id}</p>}
                    </div>

                    <div>
                        <Label htmlFor="loan_date">Tanggal Pinjaman <span className="text-destructive">*</span></Label>
                        <Input
                            id="loan_date"
                            type="date"
                            value={data.loan_date}
                            onChange={(e) => setData('loan_date', e.target.value)}
                            className="mt-1"
                        />
                        {errors.loan_date && <p className="text-sm text-destructive mt-1">{errors.loan_date}</p>}
                    </div>

                    <div>
                        <Label htmlFor="amount">Jumlah Pinjaman (Rp) <span className="text-destructive">*</span></Label>
                        <Input
                            id="amount"
                            type="number"
                            min={1}
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            placeholder="0"
                            className="mt-1"
                        />
                        {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount}</p>}
                    </div>

                    <div>
                        <Label htmlFor="bank_id">Sumber Dana (Bank/Kas)</Label>
                        <Combobox
                            options={bankOptions}
                            value={data.bank_id}
                            onValueChange={(v) => setData('bank_id', v)}
                            placeholder="Pilih Bank/Kas"
                            searchPlaceholder="Cari bank..."
                            className="mt-1"
                        />
                        {errors.bank_id && <p className="text-sm text-destructive mt-1">{errors.bank_id}</p>}
                    </div>

                    <div>
                        <Label htmlFor="notes">Catatan</Label>
                        <Textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Keterangan tambahan..."
                            className="mt-1"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.visit('/member-loans')}>
                            Batal
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
