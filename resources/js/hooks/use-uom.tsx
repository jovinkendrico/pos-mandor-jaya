import { destroy, store, update } from '@/routes/uoms';
import { IUOM } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const UOMSchema = Yup.object().shape({
    name: Yup.string().required('Nama UOM harus diisi.'),
});

type InertiaVisitOptions = Parameters<typeof router.visit>[1];

const useUOM = (closeModal: () => void, isNested: boolean = false) => {
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

    const handleSubmit = async (uom?: IUOM) => {
        clearErrors();

        try {
            await UOMSchema.validate(data, { abortEarly: false });
            const submitOptions: InertiaVisitOptions = {
                onSuccess: () => {
                    reset();
                    toast.success(
                        uom
                            ? `UOM: ${data.name} berhasil diupdate`
                            : `UOM: ${data.name} berhasil ditambahkan`,
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

            submit(uom ? update(uom.id) : store(), submitOptions);
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

    const handleDelete = (uom: IUOM) => {
        router.delete(destroy(uom.id).url, {
            onSuccess: () => {
                toast.success(`UOM: ${uom.name} berhasil dihapus`);
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
