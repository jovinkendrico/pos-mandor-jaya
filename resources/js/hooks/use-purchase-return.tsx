import { RefundMethod, ReturnType } from '@/constants/enum';
import { formatDatetoString, formatNumberWithSeparator, parseStringtoDecimal } from '@/lib/utils';
import { store } from '@/routes/purchase-returns';
import { IPurchaseDetail } from '@/types';
import { useForm } from '@inertiajs/react';
import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const RefundMethodValues = Object.values(RefundMethod);

const detailsSchema = Yup.object().shape({
    item_id: Yup.number()
        .required('Barang harus dipilih.')
        .min(1, 'Barang harus dipilih.'),
    item_uom_id: Yup.number()
        .required('UOM harus dipilih.')
        .min(1, 'UOM harus dipilih.'),
    quantity: Yup.number()
        .required('Jumlah barang harus diisi.')
        .min(0.01, 'Jumlah barang minimal 0.01'),
    price: Yup.number().required('Harga barang harus diisi.'),
    discount1_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
    discount2_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
});

const purchaseReturnSchema = Yup.object().shape({
    purchase_id: Yup.number().required('Pembelian harus dipilih.'),
    return_date: Yup.date().required('Tanggal retur harus diisi.'),
    return_type: Yup.string().required('Tipe retur harus dipilih.'),
    refund_bank: Yup.number().nullable(),
    refund_method: Yup.mixed<RefundMethod>().when('return_type', {
        is: ReturnType.STOCK_AND_REFUND,

        then: (schema) =>
            schema
                .required(
                    'Metode retur harus dipilih jika tipe retur adalah Stok & Refund.',
                )
                .oneOf(RefundMethodValues, 'Metode retur tidak valid.'),

        otherwise: (schema) =>
            schema
                .nullable()
                .oneOf(
                    [...RefundMethodValues, null, undefined],
                    'Metode retur tidak valid.',
                ),
    }),
    ppn_percent: Yup.number()
        .min(0, 'PPN tidak boleh negatif.')
        .max(100, 'PPN tidak boleh lebih dari 100.'),
    reason: Yup.string().max(255, 'Maksimal 255 karakter.'),
    details: Yup.array().of(detailsSchema).min(1, 'Minimal ada satu barang.'),
});

const usePurchaseReturn = () => {
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
        purchase_id: 0,
        return_date: new Date(),
        return_type: ReturnType.STOCK_ONLY,
        refund_bank_id: null as number | null,
        refund_method: RefundMethod.CASH_REFUND as RefundMethod | null,
        ppn_percent: 0,
        reason: '',
        details: [
            {
                item_id: 0,
                item_uom_id: 0,
                quantity: 0,
                price: 0,
                discount1_percent: 0,
                discount2_percent: 0,
            },
        ] as IPurchaseDetail[],
    });

    transform((data) => ({
        ...data,
        return_date: data.return_date
            ? formatDatetoString(data.return_date)
            : data.return_date,
        details: data.details.filter((detail: any) => detail.selected),
    }));

    const handleSubmit = async () => {
        clearErrors();

        const filteredData = {
            ...data,
            details: data.details.filter((detail: any) => detail.selected),
        };

        try {
            await purchaseReturnSchema.validate(filteredData, {
                abortEarly: false,
            });
            submit(store(), {
                onSuccess: () => {
                    reset();
                    toast.success(`Return pembelian berhasil ditambahkan`);
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
        handleChangeItem(0, 'item_id', 0);
        handleChangeItem(0, 'item_uom_id', 0);
        handleChangeItem(0, 'quantity', 0);
        handleChangeItem(0, 'price', 0);
        handleChangeItem(0, 'discount1_percent', 0);
        handleChangeItem(0, 'discount2_percent', 0);
        reset();
    };

    const handleChangeItem = (
        index: number,
        field: keyof IPurchaseDetail | 'item_id' | 'item_name' | 'item_uom_id',
        value: string | number | null,
    ) => {
        const updated = [...data.details];
        const detailToUpdate = updated[index];

        if (!detailToUpdate) return;

        if (field === 'item_uom_id') {
            detailToUpdate.item_uom_id = value as number;
        } else if (field === 'item_id') {
            detailToUpdate.item_id = value as number;
        } else {
            switch (field) {
                case 'quantity':
                    detailToUpdate.quantity = value as number;
                    break;
                case 'price':
                    detailToUpdate.price = value as number;
                    break;
                case 'discount1_percent':
                    detailToUpdate.discount1_percent = value as number;
                    break;
                case 'discount2_percent':
                    detailToUpdate.discount2_percent = value as number;
                    break;
                default:
                    break;
            }
        }

        setData('details', updated);
    };

    const handleQuantityChange = (
        index: number,
        e: ChangeEvent<HTMLInputElement>,
        quantityDisplayValues: string[],
        setQuantityDisplayValue: Dispatch<SetStateAction<string[]>>,
    ) => {
        const input = e.target.value;

        if (input === '') {
            handleChangeItem(index, 'quantity', 0);
            setQuantityDisplayValue([
                ...quantityDisplayValues.slice(0, index),
                '0',
                ...quantityDisplayValues.slice(index + 1),
            ]);
            return;
        }

        const rawValue = parseStringtoDecimal(input);

        const validRawValue = isNaN(rawValue ?? 0) ? 0 : rawValue;

        handleChangeItem(index, 'quantity', validRawValue);
        setQuantityDisplayValue([
            ...quantityDisplayValues.slice(0, index),
            formatNumberWithSeparator(validRawValue ?? 0),
            ...quantityDisplayValues.slice(index + 1),
        ]);
    };

    return {
        data,
        setData,
        errors,
        processing,
        reset,

        handleSubmit,
        handleCancel,
        handleChangeItem,
        handleQuantityChange,
    };
};

export default usePurchaseReturn;
