import { destroy, store, update } from '@/routes/suppliers';
import { ISupplier } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

const useSupplier = (closeModal: () => void) => {
    const { data, setData, errors, processing, submit, reset } = useForm({
        name: '',
        address: '',
        city_id: '',
        phone_number: '',
        contact: '',
    });

    const handleSubmit = (supplier?: ISupplier) => {
        submit(supplier ? update(supplier.id) : store(), {
            onSuccess: () => {
                reset();
                toast.success(
                    supplier
                        ? 'Supplier berhasil diupdate'
                        : 'Supplier berhasil ditambahkan',
                );
                closeModal();
            },
            onError: () => {
                toast.error('Terjadi kesalahan, periksa input Anda.');
            },
        });
    };

    const handleDelete = (supplier: ISupplier) => {
        router.delete(destroy(supplier.id).url, {
            onSuccess: () => {
                toast.success('Supplier berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus supplier');
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

export default useSupplier;
