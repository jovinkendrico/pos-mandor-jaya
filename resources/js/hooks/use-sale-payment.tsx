import { PaymentMethod, SalePaymentStatus } from '@/constants/enum';
import { formatCurrency, parseStringtoNumber } from '@/lib/utils';
import { ISalePayment, ISalePaymentFormItem } from '@/types';
import { useForm } from '@inertiajs/react';
import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const PaymentMethodValues = Object.values(PaymentMethod);
const SalePaymentStatusValues = Object.values(SalePaymentStatus);

const itemSchema = Yup.object().shape({
    sale_id: Yup.number()
        .required('Penjualan harus dipilih.')
        .min(1, 'Penjualan harus dipilih.'),
    amount: Yup.number()
        .required('Jumlah pembayaran harus diisi.')
        .min(1, 'Jumlah pembayaran minimal 1.'),
});

const salePaymentSchema = Yup.object().shape({
    payment_date: Yup.date().required('Tanggal pembayaran harus diisi.'),
    items: Yup.array().of(itemSchema).min(1, 'Minimal ada satu pembayaran.'),
    bank_id: Yup.number().nullable(),
    payment_method: Yup.mixed<PaymentMethod>()
        .oneOf(PaymentMethodValues)
        .required('Metode pembayaran harus dipilih.'),
    reference_number: Yup.string()
        .max(255, 'Maksimal 255 karakter.')
        .nullable(),
    notes: Yup.string().max(255, 'Maksimal 255 karakter.').nullable(),
    status: Yup.mixed<SalePaymentStatus>()
        .oneOf(SalePaymentStatusValues)
        .required('Status pembayaran harus dipilih.'),
});

const useSalePayments = () => {
    const {
        data,
        setData,
        errors,
        processing,
        submit,
        reset,
        setError,
        clearErrors,
    } = useForm({
        payment_date: new Date(),
        items: [
            {
                sale_id: 0,
                amount: 0,
            },
        ] as ISalePaymentFormItem[],
        bank_id: null as number | null,
        payment_method: PaymentMethod.CASH,
        reference_number: '',
        notes: '',
        status: SalePaymentStatus.PENDING,
    });

    const handleSubmit = async (sale_payment?: ISalePayment) => {
        clearErrors();

        try {
            await salePaymentSchema.validate(data, { abortEarly: false });

            const method = sale_payment ? 'put' : 'post';
            const url = sale_payment
                ? `/sale-payments/${sale_payment.id}`
                : '/sale-payments';

            submit(method, url, {
                onSuccess: () => {
                    reset();
                    toast.success(
                        sale_payment
                            ? `Pembayaran Penjualan berhasil diupdate`
                            : `Pembayaran Penjualan berhasil ditambahkan`,
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
        handleChangeInvoice(0, 'sale_id', 0);
        handleChangeInvoice(0, 'amount', 0);
        reset();
    };

    const addInvoice = () => {
        setData('items', [
            ...data.items,
            {
                sale_id: 0,
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
        field: keyof ISalePaymentFormItem,
        value: string | number | null,
    ) => {
        const updated = [...data.items];
        const itemToUpdate = updated[index];

        if (!itemToUpdate) return;

        if (field === 'sale_id') {
            itemToUpdate.sale_id = value as number;
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

export default useSalePayments;
