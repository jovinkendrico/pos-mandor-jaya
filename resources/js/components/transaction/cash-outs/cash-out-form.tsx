import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Bank, CashOut, ChartOfAccount } from '@/types';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CashOutFormProps {
    cashOut?: CashOut;
    banks: Bank[];
    expenseAccounts: ChartOfAccount[];
}

export default function CashOutForm({
    cashOut,
    banks,
    expenseAccounts,
}: CashOutFormProps) {
    const [displayAmount, setDisplayAmount] = useState('');

    const form = useForm({
        cash_out_date: cashOut?.cash_out_date
            ? new Date(cashOut.cash_out_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        bank_id: cashOut?.bank_id ? cashOut.bank_id.toString() : '',
        chart_of_account_id: cashOut?.chart_of_account_id
            ? cashOut.chart_of_account_id.toString()
            : '',
        amount: cashOut?.amount || 0,
        description: cashOut?.description || '',
        auto_post: false,
    });

    useEffect(() => {
        if (cashOut?.amount) {
            setDisplayAmount(formatCurrency(cashOut.amount));
        }
    }, [cashOut]);

    const handleAmountChange = (value: string) => {
        setDisplayAmount(value);
        const parsed = parseCurrency(value);
        if (parsed !== null) {
            form.setData('amount', parsed);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (cashOut) {
            form.put(`/cash-outs/${cashOut.id}`, {
                onSuccess: () => {
                    toast.success('Kas keluar berhasil diperbarui');
                },
                onError: () => {
                    toast.error('Gagal memperbarui kas keluar');
                },
            });
        } else {
            form.post('/cash-outs', {
                onSuccess: () => {
                    toast.success('Kas keluar berhasil ditambahkan');
                },
                onError: () => {
                    toast.error('Gagal menyimpan kas keluar');
                },
            });
        }
    };

    const bankOptions = banks.map((bank) => ({
        value: bank.id.toString(),
        label: `${bank.name} (${formatCurrency(bank.balance)})`,
    }));

    const accountOptions = expenseAccounts.map((account) => ({
        value: account.id.toString(),
        label: `${account.code} - ${account.name}`,
    }));

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Kas Keluar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cash_out_date">Tanggal *</Label>
                            <DatePicker
                                value={
                                    form.data.cash_out_date
                                        ? new Date(form.data.cash_out_date)
                                        : new Date()
                                }
                                onChange={(date) =>
                                    form.setData(
                                        'cash_out_date',
                                        date
                                            ? date.toISOString().split('T')[0]
                                            : new Date().toISOString().split('T')[0],
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.cash_out_date}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bank_id">Bank/Kas *</Label>
                            <Select
                                value={form.data.bank_id || undefined}
                                onValueChange={(value) =>
                                    form.setData('bank_id', value)
                                }
                            >
                                <SelectTrigger id="bank_id">
                                    <SelectValue placeholder="Pilih Bank/Kas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankOptions.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.bank_id} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="chart_of_account_id">
                                Akun Pengeluaran *
                            </Label>
                            <Select
                                value={form.data.chart_of_account_id || undefined}
                                onValueChange={(value) =>
                                    form.setData('chart_of_account_id', value)
                                }
                            >
                                <SelectTrigger id="chart_of_account_id">
                                    <SelectValue placeholder="Pilih Akun Pengeluaran" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accountOptions.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError
                                message={form.errors.chart_of_account_id}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Jumlah *</Label>
                            <Input
                                id="amount"
                                type="text"
                                value={displayAmount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                placeholder="0"
                            />
                            <InputError message={form.errors.amount} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Keterangan</Label>
                        <Textarea
                            id="description"
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            placeholder="Masukkan keterangan kas keluar"
                            rows={3}
                        />
                        <InputError message={form.errors.description} />
                    </div>

                    {!cashOut && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="auto_post"
                                checked={form.data.auto_post}
                                onCheckedChange={(checked) =>
                                    form.setData('auto_post', checked === true)
                                }
                            />
                            <Label
                                htmlFor="auto_post"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Posting otomatis ke jurnal
                            </Label>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/cash-outs')}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="btn-primary"
                        >
                            {form.processing
                                ? 'Menyimpan...'
                                : cashOut
                                  ? 'Perbarui'
                                  : 'Simpan'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

