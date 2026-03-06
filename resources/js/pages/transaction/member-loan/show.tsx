import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Payment {
    id: number;
    payment_number: string;
    payment_date: string;
    amount: number;
    status: 'pending' | 'confirmed';
    notes?: string;
    bank?: { name: string };
}

interface Loan {
    id: number;
    loan_number: string;
    loan_date: string;
    amount: number;
    status: 'pending' | 'confirmed';
    is_opening_balance: boolean;
    total_paid: number;
    remaining_amount: number;
    notes?: string;
    member: { id: number; name: string; phone_number?: string };
    bank?: { name: string };
    payments: Payment[];
    creator?: { name: string };
    updater?: { name: string };
}

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(Math.round(n));
const pct = (paid: number, total: number) => total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

export default function MemberLoanShow({ loan, banks }: { loan: Loan; banks: { id: number; name: string }[] }) {
    const { flash } = usePage<any>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Transaksi', href: '#' },
        { title: 'Pinjaman Anggota', href: '/member-loans' },
        { title: loan.loan_number, href: '#' },
    ];

    // Payment form state
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        member_loan_id: loan.id.toString(),
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        bank_id: '',
        notes: '',
    });

    const bankOptions = banks.map((b) => ({ value: b.id.toString(), label: b.name }));

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/member-loan-payments', {
            onSuccess: () => {
                reset('amount', 'notes');
                setShowPaymentForm(false);
            },
        });
    };

    const handleConfirmLoan = () => {
        if (!confirm('Konfirmasi pinjaman ini? Jurnal akan dibuat otomatis.')) return;
        router.post(`/member-loans/${loan.id}/confirm`);
    };

    const handleUnconfirmLoan = () => {
        if (!confirm('Batalkan konfirmasi pinjaman ini?')) return;
        router.post(`/member-loans/${loan.id}/unconfirm`);
    };

    const handleConfirmPayment = (payment: Payment) => {
        if (!confirm(`Konfirmasi pembayaran ${payment.payment_number}?`)) return;
        router.post(`/member-loan-payments/${payment.id}/confirm`);
    };

    const handleDeletePayment = (payment: Payment) => {
        if (!confirm(`Hapus pembayaran ${payment.payment_number}?`)) return;
        router.delete(`/member-loan-payments/${payment.id}`);
    };

    const progress = pct(loan.total_paid, loan.amount);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Pinjaman ${loan.loan_number}`} />

            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.visit('/member-loans')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <PageTitle title={`Pinjaman ${loan.loan_number}`} />
                <div className="ml-auto flex gap-2">
                    {loan.status === 'pending' && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => router.visit(`/member-loans/${loan.id}/edit`)}>
                                <Pencil className="mr-1 h-4 w-4" />Edit
                            </Button>
                            <Button size="sm" onClick={handleConfirmLoan}>
                                <CheckCircle className="mr-1 h-4 w-4" />Konfirmasi
                            </Button>
                        </>
                    )}
                    {loan.status === 'confirmed' && loan.payments.every((p) => p.status !== 'confirmed') && (
                        <Button variant="outline" size="sm" onClick={handleUnconfirmLoan}>
                            <XCircle className="mr-1 h-4 w-4" />Batalkan Konfirmasi
                        </Button>
                    )}
                </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
                {/* Info Card */}
                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Detail Pinjaman</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">No. Pinjaman</span><p className="font-mono font-medium">{loan.loan_number}</p></div>
                        <div><span className="text-muted-foreground">Anggota</span><p className="font-medium">{loan.member?.name}</p>{loan.member?.phone_number && <p className="text-muted-foreground">{loan.member.phone_number}</p>}</div>
                        <div><span className="text-muted-foreground">Tanggal</span><p>{loan.loan_date}</p></div>
                        <div><span className="text-muted-foreground">Sumber Dana</span><p>{loan.bank?.name ?? (loan.is_opening_balance ? 'Saldo Awal' : '-')}</p></div>
                        <div><span className="text-muted-foreground">Status</span>
                            <p className="mt-1">
                                {loan.status === 'confirmed'
                                    ? <Badge className="bg-green-100 text-green-700">Dikonfirmasi</Badge>
                                    : <Badge variant="secondary">Pending</Badge>}
                                {loan.is_opening_balance && <Badge variant="outline" className="ml-1">Saldo Awal</Badge>}
                            </p>
                        </div>
                        {loan.notes && <div className="col-span-2"><span className="text-muted-foreground">Catatan</span><p>{loan.notes}</p></div>}
                    </CardContent>
                </Card>

                {/* Summary Card */}
                <Card>
                    <CardHeader><CardTitle>Ringkasan</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Pinjaman</span>
                            <span className="font-medium">Rp {fmt(loan.amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Terbayar</span>
                            <span className="font-medium text-green-600">Rp {fmt(loan.total_paid)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                            <span className={loan.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}>Sisa</span>
                            <span className={loan.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}>Rp {fmt(loan.remaining_amount)}</span>
                        </div>
                        {/* Progress bar */}
                        <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Kemajuan</span><span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted">
                                <div
                                    className="h-2 rounded-full bg-green-500 transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payments */}
            <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">Riwayat Pembayaran</h2>
                    {loan.status === 'confirmed' && loan.remaining_amount > 0 && (
                        <Button size="sm" onClick={() => setShowPaymentForm(!showPaymentForm)}>
                            <Plus className="mr-1 h-4 w-4" />Tambah Pembayaran
                        </Button>
                    )}
                </div>

                {/* Payment Form */}
                {showPaymentForm && (
                    <Card className="mb-4">
                        <CardHeader><CardTitle className="text-base">Input Pembayaran</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handlePaymentSubmit} className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Tanggal Bayar</Label>
                                    <Input type="date" value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} className="mt-1" />
                                    {errors.payment_date && <p className="text-sm text-destructive">{errors.payment_date}</p>}
                                </div>
                                <div>
                                    <Label>Jumlah (Rp)</Label>
                                    <Input type="number" min={1} max={loan.remaining_amount} value={data.amount} onChange={(e) => setData('amount', e.target.value)} placeholder={`Maks Rp ${fmt(loan.remaining_amount)}`} className="mt-1" />
                                    {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                                </div>
                                <div>
                                    <Label>Bank/Kas Penerima</Label>
                                    <Combobox options={bankOptions} value={data.bank_id} onValueChange={(v) => setData('bank_id', v)} placeholder="Pilih Bank..." searchPlaceholder="Cari..." className="mt-1" />
                                </div>
                                <div>
                                    <Label>Catatan</Label>
                                    <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="mt-1" rows={1} />
                                </div>
                                <div className="col-span-2 flex gap-2">
                                    <Button type="submit" size="sm" disabled={processing}>Simpan</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowPaymentForm(false)}>Batal</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No. Pembayaran</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                                <TableHead>Bank</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loan.payments.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">Belum ada pembayaran</TableCell></TableRow>
                            )}
                            {loan.payments.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-mono">{p.payment_number}</TableCell>
                                    <TableCell>{p.payment_date}</TableCell>
                                    <TableCell className="text-right">Rp {fmt(p.amount)}</TableCell>
                                    <TableCell>{p.bank?.name ?? '-'}</TableCell>
                                    <TableCell>
                                        {p.status === 'confirmed'
                                            ? <Badge className="bg-green-100 text-green-700">Dikonfirmasi</Badge>
                                            : <Badge variant="secondary">Pending</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {p.status === 'pending' && (
                                                <>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleConfirmPayment(p)}>
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeletePayment(p)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
