import { destroy, store, update } from '@/routes/items';
import { IItem, IItemUOM } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const uomSchema = Yup.object().shape({
    uom_id: Yup.number().required('UOM harus dipilih.'),
    conversion_value: Yup.number()
        .required('Nilai konversi harus diisi.')
        .min(1, 'Nilai konversi minimal 1.'),
    price: Yup.number().required('Harga barang harus diisi.'),
    is_base: Yup.boolean().required('UOM utama harus dipilih.'),
    uom: Yup.object().shape({
        id: Yup.number().required('UOM harus dipilih.'),
        name: Yup.string().required('UOM harus dipilih.'),
    }),
});

const stockMovementsSchema = Yup.object().shape({
    remaining_quantity: Yup.number().min(1, 'Sisa stok harus lebih besar 0.'),
    unit_cost: Yup.number().min(1, 'Harga unit harus lebih besar 0.'),
    movement_date: Yup.date().required('Tanggal harus diisi.'),
    notes: Yup.string().max(255, 'Maksimal 255 karakter.'),
});

const itemSchema = Yup.object().shape({
    name: Yup.string()
        .required('Nama barang harus diisi.')
        .max(255, 'Maksimal 255 karakter.'),
    stock: Yup.number().nullable(),
    description: Yup.string().nullable().max(255, 'Maksimal 255 karakter.'),
    uoms: Yup.array()
        .of(uomSchema)
        .required('Minimal harus ada 1 UOM.')
        .min(1, 'Minimal harus ada 1 UOM.')
        .test(
            'one-base-uom',
            'Harus ada satu UOM sebagai "Base"',
            (uomsArray) => {
                if (!uomsArray) return false;
                const baseUoms = uomsArray.filter(
                    (uom) => uom.is_base === true,
                );
                return baseUoms.length === 1;
            },
        )
        .test(
            'base-uom-conversion',
            'UOM yang menjadi "Base" harus memiliki nilai konversi = 1',
            (uomsArray) => {
                if (!uomsArray) return true; // Let the other test handle empty/invalid arrays
                const baseUOM = uomsArray.find((uom) => uom.is_base === true);

                if (baseUOM) {
                    return baseUOM.conversion_value === 1;
                }

                return true; // If no base found, this test passes (because 'one-base-uom' test will fail)
            },
        ),
    stock_movements: Yup.array()
        .of(stockMovementsSchema)
        .required('Minimal harus ada 1 stock movement.'),
});

const useItem = (closeModal: () => void = () => {}) => {
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
        name: '',
        stock: 0,
        description: '',
        uoms: [
            {
                uom_id: 0,
                uom: {
                    id: 0,
                    name: '',
                },
                conversion_value: 1,
                price: 0,
                is_base: true,
            },
        ] as IItemUOM[],
    });

    const handleSubmit = async (item?: IItem) => {
        clearErrors();

        try {
            await itemSchema.validate(data, { abortEarly: false });

            submit(item ? update(item.id) : store(), {
                onSuccess: () => {
                    reset();
                    toast.success(
                        item
                            ? 'Item berhasil diupdate'
                            : 'Item berhasil ditambahkan',
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

    const handleDelete = (item: IItem) => {
        if (!item.id) return;
        router.delete(destroy(item.id).url, {
            onSuccess: () => {
                toast.success('Item berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus item');
            },
        });
    };

    const handleCancel = () => {
        reset();
        closeModal();
    };

    const addUOM = () => {
        setData('uoms', [
            ...data.uoms,
            {
                uom_id: 0,
                uom: {
                    id: 0,
                    name: '',
                },
                conversion_value: 0,
                price: 0,
                is_base: false,
            },
        ]);
    };

    const removeUOM = (index: number) => {
        if (data.uoms.length === 1 || index >= data.uoms.length) return;

        const updated = [...data.uoms];
        const deletedUOM = updated[index];

        updated.splice(index, 1);

        if (deletedUOM.is_base || updated.length === 1) {
            updated[0].is_base = true;
        }

        setData('uoms', updated);
    };

    const handleChangeUOM = (
        index: number,
        field: keyof IItemUOM | 'uom.id' | 'uom.name',
        value: string | number | boolean | null,
    ) => {
        const updated = [...data.uoms];
        const uomToUpdate = updated[index];

        if (!uomToUpdate) return;

        if (field === 'uom.id') {
            uomToUpdate.uom.id = value as number;
            uomToUpdate.uom_id = value as number;
        } else if (field === 'uom.name') {
            uomToUpdate.uom.name = value as string;
        } else {
            switch (field) {
                case 'conversion_value':
                    uomToUpdate.conversion_value = value as number;
                    break;
                case 'price':
                    uomToUpdate.price = value as number;
                    break;
                case 'is_base':
                    if (value === false) return;
                    uomToUpdate.is_base = value as boolean;

                    if (value === true) {
                        updated.forEach((uom, i) => {
                            if (i !== index) {
                                uom.is_base = false;
                            }
                        });
                        uomToUpdate.conversion_value = 1;
                    }
                    break;
                default:
                    break;
            }
        }

        setData('uoms', updated);
    };

    return {
        data,
        setData,
        errors,
        processing,
        reset,

        addUOM,
        removeUOM,

        handleSubmit,
        handleCancel,
        handleDelete,
        handleChangeUOM,
    };
};

export default useItem;
