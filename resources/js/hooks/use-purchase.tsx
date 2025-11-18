import { destroy, store, update } from '@/routes/purchases';
import { IPurchase, IPurchaseDetail } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const detailsSchema = Yup.object().shape({
    item_id: Yup.number()
        .required('Barang harus dipilih.')
        .min(1, 'Barang harus dipilih.'),
    item_uom_id: Yup.number()
        .required('UOM harus dipilih.')
        .min(1, 'UOM harus dipilih.'),
    quantity: Yup.number().required('Jumlah barang harus diisi.'),
    price: Yup.number().required('Harga barang harus diisi.'),
    notes: Yup.string().max(255, 'Maksimal 255 karakter.'),
    discount1_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
    discount2_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
});

const purchaseSchema = Yup.object().shape({
    supplier_id: Yup.number()
        .required('Supplier harus dipilih.')
        .min(1, 'Supplier harus dipilih.'),
    purchase_date: Yup.date().required('Tanggal harus diisi.'),
    due_date: Yup.date(),
    discount1_percent: Yup.number()
        .min(0, 'Diskon tidak boleh negatif.')
        .max(100, 'Diskon tidak boleh lebih dari 100.'),
    discount2_percent: Yup.number()
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
    } = useForm({
        supplier_id: 0,
        purchase_date: new Date(),
        due_date: null as unknown as null | Date,
        discount1_percent: 0,
        discount2_percent: 0,
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
            },
        ] as IPurchaseDetail[],
    });

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

                onError: (error) => {
                    toast.error('Terjadi kesalahan, periksa input Anda.');
                    console.log(error);
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

    const handleDelete = (purchase: IPurchase) => {
        if (!purchase.id) return;
        router.delete(destroy(purchase.id).url, {
            onSuccess: () => {
                toast.success('Pembelian berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus pembelian');
            },
        });
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
        value: string | number,
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

    return {
        data,
        setData,
        errors,
        processing,
        reset,

        addItem,
        removeItem,

        handleSubmit,
        handleDelete,
        handleCancel,
        handleChangeItem,
    };
};

export default usePurchase;
