import { destroy, store, update } from '@/routes/cities';
import { ICity } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const citySchema = Yup.object().shape({
    name: Yup.string().required('Nama Kota harus diisi.'),
});

type InertiaVisitOptions = Parameters<typeof router.visit>[1];

const useCity = (closeModal: () => void, isNested: boolean = false) => {
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
    });

    const handleSubmit = async (city?: ICity) => {
        clearErrors();

        try {
            await citySchema.validate(data, { abortEarly: false });
            const submitOptions: InertiaVisitOptions = {
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
            };
            if (isNested) {
                submitOptions.preserveState = true;
                submitOptions.preserveScroll = true;
            }
            submit(city ? update(city.id) : store(), submitOptions);
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
