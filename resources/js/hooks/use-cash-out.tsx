import { formatCurrency, formatDatetoString, parseStringtoNumber } from '@/lib/utils';
import { store, update } from '@/routes/cash-outs';
import { ICashOut } from '@/types';
import { useForm } from '@inertiajs/react';
import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const cashOutSchema = Yup.object().shape({
    cash_out_date: Yup.date().required('Tanggal kas keluar harus diisi.'),
    bank_id: Yup.number()
        .required('Bank harus dipilih.')
        .min(1, 'Bank harus dipilih.'),
    chart_of_account_id: Yup.number()
        .required('Akun harus dipilih.')
        .min(1, 'Akun harus dipilih.'),
    amount: Yup.number()
        .required('Jumlah harus diisi.')
        .min(1, 'Jumlah minimal 1.'),
    description: Yup.string().max(255, 'Maksimal 255 karakter.').nullable(),
    auto_post: Yup.boolean(),
});

const useCashOut = () => {
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
    } = useForm({
        cash_out_date: new Date(),
        bank_id: 0,
        chart_of_account_id: 0,
        amount: 0,
        description: '',
        auto_post: false,
    });

    transform((data) => ({
        ...data,
        cash_out_date: data.cash_out_date
            ? formatDatetoString(data.cash_out_date)
            : data.cash_out_date,
    }));
    const handleSubmit = async (cashOut?: ICashOut) => {
        clearErrors();

        try {
            await cashOutSchema.validate(data, { abortEarly: false });
            submit(cashOut ? update(cashOut.id) : store(), {
                onSuccess: () => {
                    reset();
                    toast.success(
                        cashOut
                            ? `Kas keluar berhasil diperbarui`
                            : `Kas keluar berhasil ditambahkan`,
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
        reset();
    };

    const handlePriceChange = (
        e: ChangeEvent<HTMLInputElement>,
        priceDisplayValues: string,
        setPriceDisplayValues: Dispatch<SetStateAction<string>>,
    ) => {
        const input = e.target.value;

        if (input === '') {
            setData('amount', 0);
            return;
        }

        const rawValue = parseStringtoNumber(input);

        setData('amount', rawValue ?? 0);
        setPriceDisplayValues(formatCurrency(rawValue ?? 0));
    };

    return {
        data,
        setData,
        errors,
        processing,
        reset,

        handleSubmit,
        handleCancel,
        handlePriceChange,
    };
};

export default useCashOut;
