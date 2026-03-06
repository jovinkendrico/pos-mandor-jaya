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

interface Loan {
    id: number;
    loan_number: string;
    member_id: number;
    loan_date: string;
    amount: number;
    bank_id?: number;
    notes?: string;
}

interface PageProps {
    loan: Loan;
    members: { id: number; name: string }[];
    banks: { id: number; name: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Transaksi', href: '#' },
    { title: 'Pinjaman Anggota', href: '/member-loans' },
    { title: 'Edit', href: '#' },
];

export default function MemberLoanEdit({ loan, members, banks }: PageProps) {
    const { flash } = usePage<any>().props;

    useEffect(() => {
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const { data, setData, put, processing, errors } = useForm({
        member_id: loan.member_id.toString(),
        loan_date: loan.loan_date,
        amount: loan.amount.toString(),
        bank_id: loan.bank_id?.toString() ?? '',
        notes: loan.notes ?? '',
    });

    const memberOptions = members.map((m) => ({ value: m.id.toString(), label: m.name }));
    const bankOptions = banks.map((b) => ({ value: b.id.toString(), label: b.name }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/member-loans/${loan.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Pinjaman Anggota" />
            <PageTitle title={`Edit Pinjaman #${loan.loan_number}`} />

            <div className="mt-4 max-w-xl rounded-lg border bg-card p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Anggota <span className="text-destructive">*</span></Label>
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
                        <Label>Tanggal Pinjaman <span className="text-destructive">*</span></Label>
                        <Input
                            type="date"
                            value={data.loan_date}
                            onChange={(e) => setData('loan_date', e.target.value)}
                            className="mt-1"
                        />
                        {errors.loan_date && <p className="text-sm text-destructive mt-1">{errors.loan_date}</p>}
                    </div>

                    <div>
                        <Label>Jumlah Pinjaman (Rp) <span className="text-destructive">*</span></Label>
                        <Input
                            type="number"
                            min={1}
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            className="mt-1"
                        />
                        {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount}</p>}
                    </div>

                    <div>
                        <Label>Sumber Dana (Bank/Kas)</Label>
                        <Combobox
                            options={bankOptions}
                            value={data.bank_id}
                            onValueChange={(v) => setData('bank_id', v)}
                            placeholder="Pilih Bank/Kas"
                            searchPlaceholder="Cari bank..."
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label>Catatan</Label>
                        <Textarea
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
                        <Button type="button" variant="outline" onClick={() => router.visit(`/member-loans/${loan.id}`)}>
                            Batal
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
