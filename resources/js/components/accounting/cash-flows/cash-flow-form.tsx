import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { ICashFlow, ICategory, IBank } from '@/types';
import { FormEventHandler, useEffect } from 'react';
import { store as storeCashFlow, update as updateCashFlow } from '@/routes/cash-flows';

interface CashFlowFormProps {
    isModalOpen: boolean;
    cashFlow?: ICashFlow;
    onModalClose: () => void;
    categories?: ICategory[];
    banks?: IBank[];
}

export default function CashFlowForm({ 
    isModalOpen, 
    cashFlow, 
    onModalClose, 
    categories = [], 
    banks = [] 
}: CashFlowFormProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        type: 'out' as 'in' | 'out',
        category_id: '',
        amount: '',
        description: '',
        bank_id: '',
        transaction_date: '',
    });

    useEffect(() => {
        if (cashFlow) {
            setData({
                type: cashFlow.type,
                category_id: cashFlow.category_id.toString(),
                amount: cashFlow.amount.toString(),
                description: cashFlow.description,
                bank_id: cashFlow.bank_id.toString(),
                transaction_date: cashFlow.transaction_date,
            });
        } else {
            reset();
        }
    }, [cashFlow, isModalOpen]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        const formData = {
            ...data,
            category_id: parseInt(data.category_id),
            amount: parseFloat(data.amount),
            bank_id: parseInt(data.bank_id),
        };

        if (cashFlow) {
            updateCashFlow(cashFlow.id, formData);
        } else {
            storeCashFlow(formData);
        }
    };

    const handleClose = () => {
        reset();
        onModalClose();
    };

    const getFilteredCategories = () => {
        return categories.filter(category => category.type === data.type);
    };

    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-semibold mb-4">
                    {cashFlow ? 'Edit Cash Flow' : 'Tambah Cash Flow'}
                </h2>
                
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="type">Tipe Cash Flow</Label>
                        <Select
                            value={data.type}
                            onValueChange={(value) => setData('type', value as 'in' | 'out')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe cash flow" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="in">Cash In (Pemasukan)</SelectItem>
                                <SelectItem value="out">Cash Out (Pengeluaran)</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && (
                            <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="category_id">Kategori</Label>
                        <Select
                            value={data.category_id}
                            onValueChange={(value) => setData('category_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {getFilteredCategories().map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="amount">Jumlah</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            className={errors.amount ? 'border-red-500' : ''}
                        />
                        {errors.amount && (
                            <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className={errors.description ? 'border-red-500' : ''}
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="bank_id">Bank/Rekening</Label>
                        <Select
                            value={data.bank_id}
                            onValueChange={(value) => setData('bank_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih bank/rekening" />
                            </SelectTrigger>
                            <SelectContent>
                                {banks.map((bank) => (
                                    <SelectItem key={bank.id} value={bank.id.toString()}>
                                        {bank.name} - {bank.account_number || 'Cash'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.bank_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.bank_id}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="transaction_date">Tanggal Transaksi</Label>
                        <Input
                            id="transaction_date"
                            type="date"
                            value={data.transaction_date}
                            onChange={(e) => setData('transaction_date', e.target.value)}
                            className={errors.transaction_date ? 'border-red-500' : ''}
                        />
                        {errors.transaction_date && (
                            <p className="text-red-500 text-sm mt-1">{errors.transaction_date}</p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="btn-primary"
                            disabled={processing}
                        >
                            {processing ? 'Menyimpan...' : (cashFlow ? 'Update' : 'Simpan')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
