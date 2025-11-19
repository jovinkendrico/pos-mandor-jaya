import { storeStockMovement, updateStockMovement } from '@/routes/items';
import { IItemStockMovement } from '@/types';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const useStockMovement = (closeModal: () => void) => {
    const stockMovementsSchema = Yup.object().shape({
        item_id: Yup.number().required('Barang harus ada.'),
        remaining_quantity: Yup.number()
            .required('Sisa stok harus diisi.')
            .min(0, 'Sisa stok tidak boleh negatif.'),
        unit_cost: Yup.number()
            .required('Harga unit harus diisi.')
            .min(0, 'Harga unit tidak boleh negatif.'),
        movement_date: Yup.date().required('Tanggal harus diisi.'),
        notes: Yup.string().max(255, 'Maksimal 255 karakter.'),
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
        remaining_quantity: 0,
        unit_cost: 0,
        movement_date: new Date(),
        notes: '',
    });

    const handleSubmit = async (
        item_id: number,
        stock_movement?: IItemStockMovement,
    ) => {
        clearErrors();

        try {
            await stockMovementsSchema.validate(data, { abortEarly: false });
            submit(
                stock_movement
                    ? updateStockMovement({
                          item: item_id,
                          id: stock_movement?.id ?? 0,
                      })
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

        handleSubmit,
        handleCancel,
    };
};

export default useStockMovement;
