import { destroy, store, update } from '@/routes/cities';
import { ICity } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

const useCity = (closeModal: () => void) => {
    const { data, setData, errors, processing, submit, reset } = useForm({
        name: '',
    });

    const handleSubmit = (city?: ICity) => {
        submit(city ? update(city.id) : store(), {
            onSuccess: () => {
                reset();
                toast.success(
                    city
                        ? 'Kota berhasil diupdate'
                        : 'Kota berhasil ditambahkan',
                );
                closeModal();
            },
            onError: () => {
                toast.error('Terjadi kesalahan, periksa input Anda.');
            },
        });
    };

    const handleDelete = (city: ICity) => {
        router.delete(destroy(city.id).url, {
            onSuccess: () => {
                toast.success('Kota berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus Kota');
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

export default useCity;
