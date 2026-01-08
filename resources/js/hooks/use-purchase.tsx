import {
    formatCurrency,
    formatNumberWithSeparator,
    parseCurrency,
    parseStringtoDecimal,
} from '@/lib/utils';
import { store, update } from '@/routes/purchases';
import { IPurchase, IPurchaseDetail } from '@/types';
import { useForm } from '@inertiajs/react';
import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const detailsSchema = Yup.object().shape({
    item_id: Yup.number()
        .required('Barang harus dipilih.')
        .min(1, 'Barang harus dipilih.'),
    item_uom_id: Yup.number()
        .required('UOM harus dipilih.')
        .min(1, 'UOM harus dipilih.'),
    quantity: Yup.number()
        .required('Jumlah barang harus diisi.')
        .positive('Jumlah barang harus lebih dari 0.'),
    price: Yup.number().required('Harga barang harus diisi.'),
    discount1_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
    discount2_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
    discount3_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
    discount4_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
});

const purchaseSchema = Yup.object().shape({
    supplier_id: Yup.number()
        .required('Supplier harus dipilih.')
        .min(1, 'Supplier harus dipilih.'),
    purchase_date: Yup.date().required('Tanggal harus diisi.'),
    due_date: Yup.date().nullable(),
    discount1_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
    discount2_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
    discount3_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
    discount4_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
    ppn_percent: Yup.number()
        .min(0, 'PPN tidak boleh negatif.')
        .max(100, 'PPN tidak boleh lebih dari 100.'),
    notes: Yup.string().max(255, 'Maksimal 255 karakter.'),
    details: Yup.array().of(detailsSchema).min(1, 'Minimal ada satu barang.'),
});

const usePurchase = () => {
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
        supplier_id: 0,
        purchase_date: new Date(),
        due_date: null as unknown as null | Date,
        discount1_percent: 0,
        discount2_percent: 0,
        discount3_percent: 0,
        discount4_percent: 0,
        ppn_percent: 0,
        notes: '',
        details: [
            {
                item_id: 0,
                item_uom_id: 0,
                quantity: 0,
                price: 0,
                discount1_percent: 0,
                discount2_percent: 0,
                discount3_percent: 0,
                discount4_percent: 0,
            },
        ] as IPurchaseDetail[],
    });

    // Ensure dates are sent as YYYY-MM-DD in local time
    transform((data) => ({
        ...data,
        purchase_date: data.purchase_date
            ? (new Date(
                data.purchase_date.getTime() -
                data.purchase_date.getTimezoneOffset() * 60000,
            )
                .toISOString()
                .split('T')[0] as unknown as Date)
            : data.purchase_date,
        due_date: data.due_date
            ? (new Date(
                data.due_date.getTime() -
                data.due_date.getTimezoneOffset() * 60000,
            )
                .toISOString()
                .split('T')[0] as unknown as Date)
            : data.due_date,
    }));

    const handleSubmit = async (purchase?: IPurchase) => {
        clearErrors();

        try {
            await purchaseSchema.validate(data, { abortEarly: false });
            submit(purchase ? update(purchase.id) : store(), {
                onSuccess: () => {
                    reset();
                    toast.success(
                        purchase
                            ? `Pembelian berhasil diupdate`
                            : `Pembelian berhasil ditambahkan`,
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
        handleChangeItem(0, 'item_id', 0);
        handleChangeItem(0, 'item_uom_id', 0);
        handleChangeItem(0, 'quantity', 0);
        handleChangeItem(0, 'price', 0);
        handleChangeItem(0, 'discount1_percent', 0);
        handleChangeItem(0, 'discount2_percent', 0);
        handleChangeItem(0, 'discount3_percent', 0);
        handleChangeItem(0, 'discount4_percent', 0);
        reset();
    };

    const addItem = () => {
        setData('details', [
            ...data.details,
            {
                item_id: 0,
                item_uom_id: 0,
                quantity: 0,
                price: 0,
                discount1_percent: 0,
                discount2_percent: 0,
                discount3_percent: 0,
                discount4_percent: 0,
            },
        ]);
    };

    const removeItem = (index: number) => {
        if (data.details.length === 1 || index >= data.details.length) return;

        const updated = [...data.details];

        updated.splice(index, 1);

        setData('details', updated);
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
                case 'discount3_percent':
                    detailToUpdate.discount3_percent = value as number;
                    break;
                case 'discount4_percent':
                    detailToUpdate.discount4_percent = value as number;
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

        if (input.endsWith(',')) {
            setQuantityDisplayValue([
                ...quantityDisplayValues.slice(0, index),
                input,
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

    const handlePriceChange = (
        index: number,
        e: ChangeEvent<HTMLInputElement>,
        priceDisplayValues: string[],
        setPriceDisplayValues: Dispatch<SetStateAction<string[]>>,
    ) => {
        const input = e.target.value;

        if (input.endsWith(',')) {
            setPriceDisplayValues([
                ...priceDisplayValues.slice(0, index),
                input,
                ...priceDisplayValues.slice(index + 1),
            ]);
            return;
        }

        const rawValue = parseCurrency(input);

        handleChangeItem(index, 'price', rawValue);
        setPriceDisplayValues([
            ...priceDisplayValues.slice(0, index),
            formatCurrency(rawValue ?? 0),
            ...priceDisplayValues.slice(index + 1),
        ]);
    };

    return {
        data,
        setData,
        errors,
        processing,
        reset,

        addItem,
        removeItem,

        handleSubmit,
        handleCancel,
        handleChangeItem,
        handleQuantityChange,
        handlePriceChange,
    };
};

export default usePurchase;
