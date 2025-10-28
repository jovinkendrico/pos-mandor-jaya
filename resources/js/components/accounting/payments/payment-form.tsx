import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { IPayment, IBank, Purchase, Sale } from '@/types';
import { FormEventHandler, useEffect } from 'react';
import { store as storePayment, update as updatePayment } from '@/routes/payments';

interface PaymentFormProps {
    isModalOpen: boolean;
    payment?: IPayment;
    onModalClose: () => void;
    banks?: IBank[];
    purchases?: Purchase[];
    sales?: Sale[];
}

export default function PaymentForm({ 
    isModalOpen, 
    payment, 
    onModalClose, 
    banks = [], 
    purchases = [], 
    sales = [] 
}: PaymentFormProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        reference_type: 'Sale' as 'Purchase' | 'Sale',
        reference_id: '',
        payment_date: '',
        amount_paid: '',
        payment_method: 'cash' as 'cash' | 'bank_transfer' | 'check' | 'other',
        bank_id: '',
        notes: '',
    });

    useEffect(() => {
        if (payment) {
            setData({
                reference_type: payment.reference_type,
                reference_id: payment.reference_id.toString(),
                payment_date: payment.payment_date,
                amount_paid: payment.amount_paid.toString(),
                payment_method: payment.payment_method,
                bank_id: payment.bank_id?.toString() || '',
                notes: payment.notes || '',
            });
        } else {
            reset();
        }
    }, [payment, isModalOpen]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        const formData = {
            ...data,
            reference_id: parseInt(data.reference_id),
            amount_paid: parseFloat(data.amount_paid),
            bank_id: data.bank_id ? parseInt(data.bank_id) : null,
        };

        if (payment) {
            updatePayment(payment.id, formData);
        } else {
            storePayment(formData);
        }
    };

    const handleClose = () => {
        reset();
        onModalClose();
    };

    const getReferenceOptions = () => {
        if (data.reference_type === 'Purchase') {
            return purchases;
        } else {
            return sales;
        }
    };

    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-semibold mb-4">
                    {payment ? 'Edit Pembayaran' : 'Tambah Pembayaran'}
                </h2>
                
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="reference_type">Tipe Transaksi</Label>
                        <Select
                            value={data.reference_type}
                            onValueChange={(value) => setData('reference_type', value as 'Purchase' | 'Sale')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe transaksi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Purchase">Purchase</SelectItem>
                                <SelectItem value="Sale">Sale</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.reference_type && (
                            <p className="text-red-500 text-sm mt-1">{errors.reference_type}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="reference_id">Transaksi</Label>
                        <Select
                            value={data.reference_id}
                            onValueChange={(value) => setData('reference_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih transaksi" />
                            </SelectTrigger>
                            <SelectContent>
                                {getReferenceOptions().map((item) => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                        {item.purchase_number || item.sale_number} - 
                                        {item.supplier?.name || item.customer?.name || 'Unknown'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.reference_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.reference_id}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="payment_date">Tanggal Pembayaran</Label>
                        <Input
                            id="payment_date"
                            type="date"
                            value={data.payment_date}
                            onChange={(e) => setData('payment_date', e.target.value)}
                            className={errors.payment_date ? 'border-red-500' : ''}
                        />
                        {errors.payment_date && (
                            <p className="text-red-500 text-sm mt-1">{errors.payment_date}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="amount_paid">Jumlah Pembayaran</Label>
                        <Input
                            id="amount_paid"
                            type="number"
                            step="0.01"
                            value={data.amount_paid}
                            onChange={(e) => setData('amount_paid', e.target.value)}
                            className={errors.amount_paid ? 'border-red-500' : ''}
                        />
                        {errors.amount_paid && (
                            <p className="text-red-500 text-sm mt-1">{errors.amount_paid}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="payment_method">Metode Pembayaran</Label>
                        <Select
                            value={data.payment_method}
                            onValueChange={(value) => setData('payment_method', value as any)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih metode pembayaran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.payment_method && (
                            <p className="text-red-500 text-sm mt-1">{errors.payment_method}</p>
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
                                <SelectItem value="">Tidak ada</SelectItem>
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
                        <Label htmlFor="notes">Catatan</Label>
                        <Textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            className={errors.notes ? 'border-red-500' : ''}
                        />
                        {errors.notes && (
                            <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
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
                            {processing ? 'Menyimpan...' : (payment ? 'Update' : 'Simpan')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
