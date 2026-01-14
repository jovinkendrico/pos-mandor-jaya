import { DatePicker } from '@/components/date-picker';
import InputError from '@/components/input-error';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatNumber, formatNumberWithSeparator, parseStringtoDecimal } from '@/lib/utils';
import { BreadcrumbItem, IBank } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormEventHandler, useState, useMemo, useEffect } from 'react';
import { formatDatetoString } from '@/lib/utils';

interface PageProps {
    banks: IBank[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Transfer Dana',
        href: '/transfers',
    },
    {
        title: 'Tambah',
        href: '#',
    },
];

const TransferCreate = (props: PageProps) => {
    const { banks } = props;

    // Convert banks to combobox options
    const bankOptions = banks.map(bank => ({
        label: `${bank.name} - ${bank.account_number || ''}`,
        value: bank.id.toString()
    }));

    const { data, setData, post, processing, errors, transform } = useForm({
        date: new Date(),
        from_bank_id: '',
        to_bank_id: '',
        amount: '', // String for input handling
        admin_fee: '', // String for input handling
        description: '',
    });

    const [amountDisplay, setAmountDisplay] = useState('');
    const [adminFeeDisplay, setAdminFeeDisplay] = useState('');

    transform((data) => ({
        ...data,
        date: data.date ? formatDatetoString(data.date) : data.date,
    }));

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/transfers');
    };

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            setData('date', date);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const numericValue = value.replace(/[^0-9]/g, '');
        const numberVal = Number(numericValue);

        setData('amount', numericValue);
        setAmountDisplay(formatNumberWithSeparator(numberVal));
    };

    const handleAdminFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const numericValue = value.replace(/[^0-9]/g, '');
        const numberVal = Number(numericValue);

        setData('admin_fee', numericValue);
        setAdminFeeDisplay(formatNumberWithSeparator(numberVal));
    };

    const totalDeduction = useMemo(() => {
        const amount = Number(data.amount) || 0;
        const fee = Number(data.admin_fee) || 0;
        return amount + fee;
    }, [data.amount, data.admin_fee]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Transfer Dana" />

            <div className="flex flex-row items-center gap-2 mb-6">
                <Link href="/transfers">
                    <ArrowLeft className="h-8 w-8" />
                </Link>
                <PageTitle title="Tambah Transfer Dana" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Tanggal Transfer</Label>
                                <DatePicker
                                    value={data.date}
                                    onChange={handleDateChange}
                                />
                                <InputError message={errors.date} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Dari Kas/Bank (Sumber)</Label>
                                <Combobox
                                    options={bankOptions}
                                    value={data.from_bank_id}
                                    onValueChange={(val) => setData('from_bank_id', val)}
                                    placeholder="Pilih Sumber..."
                                    searchPlaceholder="Cari Sumber..."
                                />
                                <InputError message={errors.from_bank_id} />
                            </div>

                            <div className="space-y-2">
                                <Label>Ke Kas/Bank (Tujuan)</Label>
                                <Combobox
                                    options={bankOptions}
                                    value={data.to_bank_id}
                                    onValueChange={(val) => setData('to_bank_id', val)}
                                    placeholder="Pilih Tujuan..."
                                    searchPlaceholder="Cari Tujuan..."
                                />
                                <InputError message={errors.to_bank_id} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Jumlah Transfer</Label>
                                <Input
                                    id="amount"
                                    value={amountDisplay}
                                    onChange={handleAmountChange}
                                    placeholder="0"
                                    className="text-right font-mono text-lg"
                                />
                                <InputError message={errors.amount} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="admin_fee">Biaya Admin</Label>
                                <Input
                                    id="admin_fee"
                                    value={adminFeeDisplay}
                                    onChange={handleAdminFeeChange}
                                    placeholder="0"
                                    className="text-right font-mono text-lg text-muted-foreground"
                                />
                                <InputError message={errors.admin_fee} />
                            </div>
                        </div>

                        {totalDeduction > 0 && (
                            <div className="p-3 bg-muted rounded-md flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium text-black">Total Potong Rekening Sumber:</span>
                                <span className="font-bold text-lg">{formatCurrency(totalDeduction)}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="description">Keterangan</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Contoh: Setor tunai ke bank..."
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={processing} className="btn-primary">
                                <Save className="mr-2 h-4 w-4" />
                                Simpan Transfer
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </AppLayout>
    );
};

export default TransferCreate;
