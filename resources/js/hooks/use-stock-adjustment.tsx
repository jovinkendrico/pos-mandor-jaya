import {
    formatCurrency,
    formatNumberWithSeparator,
    parseStringtoNumber,
} from '@/lib/utils';
import { store, update } from '@/routes/stock-adjustments';
import { IStockAdjustment } from '@/types';
import { useForm } from '@inertiajs/react';
import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const stockAdjustmentSchema = Yup.object().shape({
    item_id: Yup.number()
        .required('Barang harus dipilih.')
        .min(1, 'Barang harus dipilih.'),
    quantity: Yup.number()
        .required('Jumlah barang harus diisi.')
        .min(1, 'Jumlah barang minimal 1.'),
    unit_cost: Yup.number().nullable(),
    adjustment_date: Yup.date().required('Tanggal harus diisi.'),
    notes: Yup.string().max(255, 'Maksimal 255 karakter.').nullable(),
});

const useStockAdjustment = (closeModal: () => void = () => {}) => {
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
        item_id: 0,
        quantity: 0,
        unit_cost: 0,
        adjustment_date: new Date(),
        notes: '',
    });

    const handleSubmit = async (stock_adjustment?: IStockAdjustment) => {
        clearErrors();

        try {
            await stockAdjustmentSchema.validate(data, { abortEarly: false });
            submit(stock_adjustment ? update(stock_adjustment.id) : store(), {
                onSuccess: () => {
                    reset();
                    toast.success(
                        stock_adjustment
                            ? `Penyesuaian Stok berhasil diupdate`
                            : `Penyesuaian Stok berhasil ditambahkan`,
                    );
                    closeModal();
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
        reset();
        closeModal();
    };

    const handleQuantityChange = (
        e: ChangeEvent<HTMLInputElement>,
        setQuantityDisplayValue: Dispatch<SetStateAction<string>>,
    ) => {
        const input = e.target.value;

        if (input === '') {
            setData('quantity', 0);
            setQuantityDisplayValue('0');
            return;
        }

        const rawValue = parseStringtoNumber(input);

        setData('quantity', rawValue ?? 0);
        setQuantityDisplayValue(formatNumberWithSeparator(rawValue ?? 0));
    };

    const handleUnitCostChange = (
        e: ChangeEvent<HTMLInputElement>,
        setUnitCostDisplayValue: Dispatch<SetStateAction<string>>,
    ) => {
        const input = e.target.value;

        if (input === '') {
            setData('unit_cost', 0);
            setUnitCostDisplayValue('0');
            return;
        }

        const rawValue = parseStringtoNumber(input);

        setData('unit_cost', rawValue ?? 0);
        setUnitCostDisplayValue(formatCurrency(rawValue ?? 0));
    };

    return {
        data,
        setData,
        errors,
        processing,
        reset,

        handleSubmit,
        handleCancel,
        handleQuantityChange,
        handleUnitCostChange,
    };
};

export default useStockAdjustment;
