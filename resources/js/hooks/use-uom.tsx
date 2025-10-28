import { destroy, store, update } from '@/routes/uoms';
import { UOM } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const UOMSchema = Yup.object().shape({
    name: Yup.string().required('Nama UOM harus diisi.'),
});

const useUOM = (closeModal: () => void) => {
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

    const handleSubmit = async (uom?: UOM) => {
        clearErrors();

        try {
            await UOMSchema.validate(data, { abortEarly: false });

            submit(uom ? update(uom.id) : store(), {
                onSuccess: () => {
                    reset();
                    toast.success(
                        uom
                            ? 'UOM berhasil diupdate'
                            : 'UOM berhasil ditambahkan',
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
