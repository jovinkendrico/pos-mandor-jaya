import { store, update } from '@/routes/banks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import InputError from '../../input-error';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';

interface Bank {
    id: number;
    name: string;
    type: 'bank' | 'cash';
    account_number?: string;
    account_name?: string;
    balance?: number;
    description?: string;
}

interface BankFormProps {
    bank?: Bank | null;
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function BankForm({ bank, isModalOpen, onOpenChange }: BankFormProps) {
    const form = useForm({
        name: '',
        type: 'bank' as 'bank' | 'cash',
        account_number: '',
        account_name: '',
        balance: '0',
        description: '',
    });

    useEffect(() => {
        if (bank) {
            form.setData({
                name: bank.name,
                type: bank.type,
                account_number: bank.account_number || '',
                account_name: bank.account_name || '',
                balance: bank.balance?.toString() || '0',
                description: bank.description || '',
            });
        } else {
            form.reset();
        }
    }, [bank, isModalOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.submit(bank ? update(bank.id) : store(), {
            onSuccess: () => {
                form.reset();
                toast.success(bank ? 'Bank/Cash berhasil diupdate' : 'Bank/Cash berhasil ditambahkan');
                onOpenChange(false);
            },
            onError: () => {
                toast.error('Terjadi kesalahan, periksa input Anda.');
            },
        });
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{bank ? 'Edit Bank/Cash' : 'Tambah Bank/Cash'}</DialogTitle>
                    <DialogDescription>
                        {bank ? 'Perbarui informasi bank/cash di bawah.' : 'Isi data detail untuk menambahkan bank/cash baru'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
                    <div className="flex flex-col space-y-4 pb-4">
                        <div className="flex flex-row gap-4">
                            <div className="w-2/3">
                                <Label htmlFor="name" required>
                                    Nama Bank/Cash
                                </Label>
                                <Input id="name" name="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                                {form.errors.name && <InputError message={form.errors.name} />}
                            </div>

                            <div className="w-1/3">
                                <Label htmlFor="type" required>
                                    Tipe
                                </Label>
                                <Select value={form.data.type} onValueChange={(value: 'bank' | 'cash') => form.setData('type', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bank">Bank</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.errors.type && <InputError message={form.errors.type} />}
                            </div>
                        </div>

                        {form.data.type === 'bank' && (
                            <>
                                <div className="flex flex-row gap-4">
                                    <div className="w-1/2">
                                        <Label htmlFor="account_number">Nomor Rekening</Label>
                                        <Input
                                            id="account_number"
                                            name="account_number"
                                            value={form.data.account_number}
                                            onChange={(e) => form.setData('account_number', e.target.value)}
                                        />
                                        {form.errors.account_number && <InputError message={form.errors.account_number} />}
                                    </div>

                                    <div className="w-1/2">
                                        <Label htmlFor="account_name">Nama Pemilik Rekening</Label>
                                        <Input
                                            id="account_name"
                                            name="account_name"
                                            value={form.data.account_name}
                                            onChange={(e) => form.setData('account_name', e.target.value)}
                                        />
                                        {form.errors.account_name && <InputError message={form.errors.account_name} />}
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <Label htmlFor="balance">Saldo Awal</Label>
                            <Input
                                id="balance"
                                name="balance"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.data.balance}
                                onChange={(e) => form.setData('balance', e.target.value)}
                            />
                            {form.errors.balance && <InputError message={form.errors.balance} />}
                        </div>

                        <div>
                            <Label htmlFor="description">Deskripsi/Catatan</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                rows={3}
                            />
                            {form.errors.description && <InputError message={form.errors.description} />}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={form.processing}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving...' : bank ? 'Update Bank/Cash' : 'Tambah Bank/Cash'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

