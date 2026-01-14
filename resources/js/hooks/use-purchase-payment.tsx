import { PaymentMethod, PurchasePaymentStatus } from '@/constants/enum';
import { formatCurrency, parseStringtoNumber } from '@/lib/utils';
import { store, update } from '@/routes/purchase-payments';
import { IPurchasePayment, IPurchasePaymentItem } from '@/types';
import { useForm } from '@inertiajs/react';
import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const PaymentMethodValues = Object.values(PaymentMethod);
const PurchasePaymentStatusValues = Object.values(PurchasePaymentStatus);

const itemSchema = Yup.object().shape({
    purchase_id: Yup.number()
        .required('Pembelian harus dipilih.')
        .min(1, 'Pembelian harus dipilih.'),
    amount: Yup.number()
        .required('Jumlah pembayaran harus diisi.')
        .min(1, 'Jumlah pembayaran minimal 1.'),
});

const purchasePaymentSchema = Yup.object().shape({
    payment_date: Yup.date().required('Tanggal pembayaran harus diisi.'),
    total_amount: Yup.number()
        .required('Total pembayaran harus diisi.')
        .min(0, 'Total pembayaran minimal 0.'),
    items: Yup.array().of(itemSchema).min(1, 'Minimal ada satu pembayaran.'),
    bank_id: Yup.number().nullable(),
    payment_method: Yup.mixed<PaymentMethod>()
        .oneOf(PaymentMethodValues)
        .required('Metode pembayaran harus dipilih.'),
    reference_number: Yup.string()
        .max(255, 'Maksimal 255 karakter.')
        .nullable(),
    notes: Yup.string().max(255, 'Maksimal 255 karakter.').nullable(),
    status: Yup.mixed<PurchasePaymentStatus>()
        .oneOf(PurchasePaymentStatusValues)
        .required('Status pembayaran harus dipilih.'),
});

const usePurchasePayments = (): any => {
    const {
        data,
        setData,
        errors,
        processing,
        submit,
        reset,
        setError,
        clearErrors,
        transform,
    } = useForm<any>({
        payment_date: new Date(),
        total_amount: 0,
        items: [
            {
                purchase_id: 0,
                amount: 0,
            },
        ] as IPurchasePaymentItem[],
        bank_id: null,
        payment_method: PaymentMethod.CASH,
        reference_number: '',
        notes: '',
        status: PurchasePaymentStatus.PENDING,
    });

    transform((data) => ({
        ...data,
        payment_date: data.payment_date
            ? (new Date(
                data.payment_date.getTime() -
                data.payment_date.getTimezoneOffset() * 60000,
            )
                .toISOString()
                .split('T')[0] as unknown as Date)
            : data.payment_date,
    }));

    const handleSubmit = async (purchase_payment?: IPurchasePayment) => {
        clearErrors();

        try {
            await purchasePaymentSchema.validate(data, { abortEarly: false });
            submit(purchase_payment ? update(purchase_payment.id) : store(), {
                onSuccess: () => {
                    reset();
                    toast.success(
                        purchase_payment
                            ? `Pembayaran Pembelian berhasil diupdate`
                            : `Pembayaran Pembelian berhasil ditambahkan`,
                    );
                },

                onError: () => {
                    toast.error('Terjadi kesalahan, periksa input Anda.');
                },
            });
        } catch (err) {
            if (err instanceof Yup.ValidationError) {
                const yupErrors: Record<string, string> = {};
                err.inner.forEach((error) => {
                    if (error.path) {
                        yupErrors[error.path] = error.message;
                    }
                });
                setError(yupErrors);
                toast.error('Validasi gagal, periksa input Anda.');
            }
        }
    };

    const handleCancel = () => {
        clearErrors();
        handleChangeInvoice(0, 'purchase_id', 0);
        handleChangeInvoice(0, 'amount', 0);
        reset();
    };

    const addInvoice = () => {
        setData('items', [
            ...data.items,
            {
                purchase_id: 0,
                amount: 0,
            },
        ]);
    };

    const removeInvoice = (index: number) => {
        if (data.items.length === 1 || index >= data.items.length) return;

        const updated = [...data.items];

        updated.splice(index, 1);

        setData('items', updated);
    };

    const handleChangeInvoice = (
        index: number,
        field: keyof IPurchasePaymentItem,
        value: string | number | null,
    ) => {
        const updated = [...data.items];
        const itemToUpdate = updated[index];

        if (!itemToUpdate) return;

        if (field === 'purchase_id') {
            itemToUpdate.purchase_id = value as number;
        } else if (field === 'amount') {
            itemToUpdate.amount = value as number;
        }

        setData('items', updated);
    };

    const handleAmountChange = (
        index: number,
        e: ChangeEvent<HTMLInputElement>,
        amountDisplayValues: string[],
        setAmountDisplayValue: Dispatch<SetStateAction<string[]>>,
    ) => {
        const input = e.target.value;

        if (input === '') {
            handleChangeInvoice(index, 'amount', 0);
            setAmountDisplayValue([
                ...amountDisplayValues.slice(0, index),
                '0',
                ...amountDisplayValues.slice(index + 1),
            ]);
            return;
        }

        const rawValue = parseStringtoNumber(input);

        const validRawValue = isNaN(rawValue ?? 0) ? 0 : rawValue;

        handleChangeInvoice(index, 'amount', validRawValue);
        setAmountDisplayValue([
            ...amountDisplayValues.slice(0, index),
            formatCurrency(validRawValue ?? 0),
            ...amountDisplayValues.slice(index + 1),
        ]);
    };

    return {
        data,
        setData,
        errors,
        processing,
        reset,

        addInvoice,
        removeInvoice,

        handleSubmit,
        handleCancel,
        handleChangeInvoice,
        handleAmountChange,
    };
};

export default usePurchasePayments;
