import { destroy, store } from '@/routes/stock-adjustments';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

interface StockAdjustmentFormData {
    item_id: number | '';
    quantity: number | '';
    unit_cost: number | '';
    adjustment_date: Date | string;
    notes: string;
}

const useStockAdjustment = (closeModal: () => void = () => {}) => {
    const { data, setData, errors, processing, reset } =
        useForm<StockAdjustmentFormData>({
            item_id: '',
            quantity: '',
            unit_cost: '',
            adjustment_date: new Date(),
            notes: '',
        });

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        router.post(store().url, data, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Penyesuaian stok berhasil ditambahkan.');
                reset();
                closeModal();
            },
            onError: () => {
                toast.error('Gagal menambahkan penyesuaian stok.');
            },
        });
    };

    const handleCancel = () => {
        reset();
        closeModal();
    };

    const handleDelete = (id: number) => {
        router.delete(destroy(id).url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Penyesuaian stok berhasil dihapus.');
            },
            onError: () => {
                toast.error('Gagal menghapus penyesuaian stok.');
            },
        });
    };

    return {
        data,
        setData,
        errors,
        processing,
        reset,
        handleSubmit,
        handleCancel,
        handleDelete,
    };
};

export default useStockAdjustment;
