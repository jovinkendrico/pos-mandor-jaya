import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Bank, IPurchase, PurchasePayment, PurchasePaymentItem } from '@/types';

interface Purchase {
    id: number;
    purchase_number: string;
    supplier?: { name: string };
    purchase_date: string;
    total_amount: number;
    total_paid?: number;
    remaining_amount?: number;
}

interface PurchasePaymentFormProps {
    payment?: PurchasePayment;
    purchases: Purchase[];
    banks: Bank[];
}

export default function PurchasePaymentForm({
    payment,
    purchases,
    banks,
}: PurchasePaymentFormProps) {
    const [displayAmounts, setDisplayAmounts] = useState<Record<number, string>>({});

    const form = useForm({
        payment_date: payment?.payment_date || new Date().toISOString().split('T')[0],
        items: (payment?.items?.length
            ? payment.items.map((item) => ({
                  purchase_id: item.purchase_id,
                  amount: item.amount,
              }))
            : [{ purchase_id: 0, amount: 0 }]) as Array<{ purchase_id: number; amount: number }>,
        bank_id: payment?.bank_id ? payment.bank_id.toString() : undefined,
        payment_method: payment?.payment_method || 'cash',
        reference_number: payment?.reference_number || '',
        notes: payment?.notes || '',
    });

    useEffect(() => {
        if (payment?.items) {
            const amounts: Record<number, string> = {};
            payment.items.forEach((item) => {
                amounts[item.purchase_id] = formatCurrency(item.amount);
            });
            setDisplayAmounts(amounts);
        }
    }, [payment]);

    const purchaseOptions: ComboboxOption[] = purchases.map((p) => ({
        value: p.id.toString(),
        label: `${p.purchase_number} - ${p.supplier?.name || 'No Supplier'} (${formatCurrency(p.total_amount)})`,
    }));

    const totalAmount = useMemo(() => {
        return form.data.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    }, [form.data.items]);

    const handleAddItem = () => {
        form.setData('items', [
            ...form.data.items,
            {
                purchase_id: 0,
                amount: 0,
            },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        if (form.data.items.length === 1) {
            toast.error('Minimal harus ada 1 invoice');
            return;
        }
        const newItems = form.data.items.filter((_, i) => i !== index);
        form.setData('items', newItems);
        const purchaseId = form.data.items[index]?.purchase_id;
        if (purchaseId) {
            setDisplayAmounts((prev) => {
                const newAmounts = { ...prev };
                delete newAmounts[purchaseId];
                return newAmounts;
            });
        }
    };

    const handlePurchaseChange = (index: number, purchaseId: string) => {
        const newItems = [...form.data.items];
        const purchase = purchases.find((p) => p.id === Number(purchaseId));
        if (purchase) {
            // remaining_amount sudah merupakan total_amount - total_paid, jadi tidak perlu dikurangi lagi
            const remaining = purchase.remaining_amount ?? (Number(purchase.total_amount) - (purchase.total_paid || 0));
            newItems[index] = {
                ...newItems[index],
                purchase_id: Number(purchaseId),
                amount: Math.min(newItems[index].amount || 0, remaining),
            };
            form.setData('items', newItems);
            setDisplayAmounts((prev) => ({
                ...prev,
                [purchase.id]: formatCurrency(newItems[index].amount),
            }));
        }
    };

    const handleAmountChange = (index: number, value: string) => {
        const rawValue = parseCurrency(value) || 0;
        const newItems = [...form.data.items];
        const purchaseId = newItems[index].purchase_id;
        const purchase = purchases.find((p) => p.id === purchaseId);

        if (purchase) {
            // remaining_amount sudah merupakan total_amount - total_paid, jadi tidak perlu dikurangi lagi
            const remaining = purchase.remaining_amount ?? (Number(purchase.total_amount) - (purchase.total_paid || 0));
            const amount = Math.min(Math.max(0, rawValue), remaining);
            newItems[index] = {
                ...newItems[index],
                amount,
            };
            form.setData('items', newItems);
            setDisplayAmounts((prev) => ({
                ...prev,
                [purchaseId]: formatCurrency(amount),
            }));
        } else if (rawValue > 0) {
            // Allow typing even if purchase not selected yet
            newItems[index] = {
                ...newItems[index],
                amount: rawValue,
            };
            form.setData('items', newItems);
            if (purchaseId) {
                setDisplayAmounts((prev) => ({
                    ...prev,
                    [purchaseId]: formatCurrency(rawValue),
                }));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (form.data.items.length === 0) {
            toast.error('Minimal harus ada 1 invoice');
            return;
        }

        if (form.data.items.some((item) => !item.purchase_id || item.amount <= 0)) {
            toast.error('Semua invoice harus dipilih dan memiliki amount > 0');
            return;
        }

        const url = payment
            ? `/purchase-payments/${payment.id}`
            : '/purchase-payments';

        form.submit(payment ? 'put' : 'post', url, {
            onSuccess: () => {
                toast.success(
                    payment
                        ? 'Pembayaran berhasil diperbarui'
                        : 'Pembayaran berhasil ditambahkan',
                );
                router.visit('/purchase-payments');
            },
            onError: () => {
                toast.error('Terjadi kesalahan, periksa input Anda.');
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="payment_date">Tanggal Pembayaran *</Label>
                            <Input
                                id="payment_date"
                                type="date"
                                value={form.data.payment_date}
                                onChange={(e) => form.setData('payment_date', e.target.value)}
                                required
                            />
                            <InputError message={form.errors.payment_date} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment_method">Metode Pembayaran *</Label>
                            <Select
                                value={form.data.payment_method}
                                onValueChange={(value) => form.setData('payment_method', value as 'cash' | 'transfer' | 'giro' | 'cek' | 'other')}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Tunai</SelectItem>
                                    <SelectItem value="transfer">Transfer</SelectItem>
                                    <SelectItem value="giro">Giro</SelectItem>
                                    <SelectItem value="cek">Cek</SelectItem>
                                    <SelectItem value="other">Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.payment_method} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bank_id">Bank</Label>
                            <Select
                                value={form.data.bank_id}
                                onValueChange={(value) => form.setData('bank_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih bank..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {banks.map((bank) => (
                                        <SelectItem key={bank.id} value={bank.id.toString()}>
                                            {bank.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.bank_id} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reference_number">No. Referensi</Label>
                            <Input
                                id="reference_number"
                                value={form.data.reference_number}
                                onChange={(e) => form.setData('reference_number', e.target.value)}
                                placeholder="No. transfer, cek, dll"
                            />
                            <InputError message={form.errors.reference_number} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Catatan</Label>
                        <Textarea
                            id="notes"
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            rows={3}
                        />
                        <InputError message={form.errors.notes} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Invoice Pembelian</CardTitle>
                        <Button type="button" onClick={handleAddItem} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Invoice
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Total Invoice</TableHead>
                                    <TableHead>Sudah Dibayar</TableHead>
                                    <TableHead>Sisa</TableHead>
                                    <TableHead className="text-right">Jumlah Pembayaran</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {form.data.items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                                            Belum ada invoice. Klik "Tambah Invoice" untuk menambahkan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    form.data.items.map((item, index) => {
                                        const purchase = purchases.find((p) => p.id === item.purchase_id);
                                        // remaining_amount sudah merupakan total_amount - total_paid, jadi tidak perlu dikurangi lagi
                                        const remaining = purchase
                                            ? (purchase.remaining_amount ?? (Number(purchase.total_amount) - (purchase.total_paid || 0)))
                                            : 0;

                                        return (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Combobox
                                                        options={purchaseOptions}
                                                        value={item.purchase_id ? item.purchase_id.toString() : ''}
                                                        onValueChange={(value) => handlePurchaseChange(index, value)}
                                                        placeholder="Pilih invoice..."
                                                        searchPlaceholder="Cari invoice..."
                                                        className="w-[200px]"
                                                    />
                                                    <InputError message={form.errors[`items.${index}.purchase_id`]} />
                                                </TableCell>
                                                <TableCell>
                                                    {purchase?.supplier?.name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {purchase ? formatCurrency(purchase.total_amount) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {purchase ? formatCurrency(purchase.total_paid || 0) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {purchase ? (
                                                        <span className={remaining > 0 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                                                            {formatCurrency(remaining)}
                                                        </span>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="text"
                                                        value={displayAmounts[item.purchase_id] || ''}
                                                        onChange={(e) => handleAmountChange(index, e.target.value)}
                                                        placeholder="0"
                                                        className="text-right"
                                                        disabled={!item.purchase_id}
                                                    />
                                                    <InputError message={form.errors[`items.${index}.amount`]} />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveItem(index)}
                                                        disabled={form.data.items.length === 1}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <div className="text-right space-y-1">
                            <div className="text-sm text-muted-foreground">Total Pembayaran</div>
                            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.visit('/purchase-payments')}
                >
                    Batal
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing ? 'Menyimpan...' : payment ? 'Perbarui' : 'Simpan'}
                </Button>
            </div>
        </form>
    );
}

