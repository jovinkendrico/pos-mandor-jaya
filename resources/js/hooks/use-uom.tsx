import { destroy, store, update } from '@/routes/uoms';
import { UOM } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

const useUOM = (closeModal: () => void) => {
    const { data, setData, errors, processing, submit, reset } = useForm({
        name: '',
    });

    const handleSubmit = (uom?: UOM) => {
        submit(uom ? update(uom.id) : store(), {
            onSuccess: () => {
                reset();
                toast.success(
                    uom ? 'UOM berhasil diupdate' : 'UOM berhasil ditambahkan',
                );
                closeModal();
            },
            onError: () => {
                toast.error('Terjadi kesalahan, periksa input Anda.');
            },
        });
    };

    const handleDelete = (uom: UOM) => {
        router.delete(destroy(uom.id).url, {
            onSuccess: () => {
                toast.success('UOM berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus UOM');
            },
        });
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
        handleDelete,
    };
};

export default useUOM;
