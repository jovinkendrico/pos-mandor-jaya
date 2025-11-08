import { storeStockMovement, updateStockMovement } from '@/routes/items';
import { IItemStockMovement } from '@/types';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const useStockMovement = (closeModal: () => void) => {
    const stockMovementsAttributeSchema = Yup.object().shape({
        remaining_quantity: Yup.number()
            .required('Sisa stok harus diisi.')
            .min(0, 'Sisa stok tidak boleh negatif.'),
        unit_cost: Yup.number()
            .required('Harga unit harus diisi.')
            .min(0, 'Harga unit tidak boleh negatif.'),
        movement_date: Yup.date().required('Tanggal harus diisi.'),
        notes: Yup.string().max(255, 'Maksimal 255 karakter.'),
    });

    const stockMovementsSchema = Yup.object().shape({
        item_id: Yup.number().required('Barang harus ada.'),
        stock_movements: Yup.array()
            .of(stockMovementsAttributeSchema)
            .min(1, 'Minimal harus ada 1 stock movement.'),
    });

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
        stock_movements: [
            {
                remaining_quantity: 0,
                unit_cost: 0,
                movement_date: new Date(),
                notes: '',
            },
        ] as IItemStockMovement[],
    });

    const addStockMovement = () => {
        setData('stock_movements', [
            ...data.stock_movements,
            {
                remaining_quantity: 0,
                unit_cost: 0,
                movement_date: new Date(),
                notes: '',
            },
        ]);
    };

    const removeStockMovement = (index: number) => {
        if (
            data.stock_movements.length === 1 ||
            index >= data.stock_movements.length
        )
            return;

        const updated = [...data.stock_movements];
        updated.splice(index, 1);
        setData('stock_movements', updated);
    };

    const handleChangeStockMovement = (
        index: number,
        field: keyof IItemStockMovement,
        value: string | number | Date | undefined,
    ) => {
        const updated = [...data.stock_movements];
        const stockMovementToUpdate = updated[index];

        if (!stockMovementToUpdate) return;

        switch (field) {
            case 'remaining_quantity':
                stockMovementToUpdate.remaining_quantity = value as number;
                break;
            case 'unit_cost':
                stockMovementToUpdate.unit_cost = value as number;
                break;
            case 'movement_date':
                stockMovementToUpdate.movement_date = value as Date;
                break;
            case 'notes':
                stockMovementToUpdate.notes = value as string;
                break;
            default:
                break;
        }

        setData('stock_movements', updated);
    };

    const handleSubmit = async (
        item_id: number,
        stock_movement?: IItemStockMovement,
    ) => {
        clearErrors();
        console.log(item_id);

        try {
            await stockMovementsSchema.validate(data, { abortEarly: false });
            submit(
                stock_movement
                    ? updateStockMovement(stock_movement?.id ?? 0)
                    : storeStockMovement(item_id),
                {
                    onSuccess: () => {
                        reset();
                        toast.success(
                            stock_movement
                                ? 'Perpindahan Stok berhasil diupdate'
                                : 'Perpindahah Stok berhasil ditambahkan',
                        );
                        closeModal();
                    },

                    onError: () => {
                        console.log(errors);
                        toast.error('Terjadi kesalahan, periksa input Anda.');
                    },
                },
            );
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

    return {
        data,
        setData,
        errors,
        processing,
        reset,

        addStockMovement,
        removeStockMovement,

        handleSubmit,
        handleCancel,
        handleChangeStockMovement,
    };
};

export default useStockMovement;
