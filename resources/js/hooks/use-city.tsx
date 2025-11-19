import { destroy, store, update } from '@/routes/cities';
import { ICity } from '@/types';
import { router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { useCallback } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const citySchema = Yup.object().shape({
    name: Yup.string().required('Nama Kota harus diisi.'),
});

type InertiaVisitOptions = Parameters<typeof router.visit>[1];

const useCity = (
    closeModal: () => void = () => {},
    isNested: boolean = false,
) => {
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
                            ? `Kota: ${data.name} berhasil diupdate`
                            : `Kota: ${data.name} berhasil ditambahkan`,
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
        });
    };

    const getCityData = useCallback(async () => {
        try {
            const response = await axios.get('/cities/search');
            return response.data.data;
        } catch (error) {
            return error;
        }
    }, []);

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

        getCityData,

        handleSubmit,
        handleCancel,
        handleDelete,
    };
};

export default useCity;
