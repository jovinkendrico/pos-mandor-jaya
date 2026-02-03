import { store, update } from '@/routes/branches';
import { IBranch } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const BranchSchema = Yup.object().shape({
    code: Yup.string().required('Kode Cabang harus diisi.').max(10, 'Kode maksimal 10 karakter.'),
    name: Yup.string().required('Nama Cabang harus diisi.'),
    address: Yup.string().nullable(),
    phone: Yup.string().nullable(),
    is_active: Yup.boolean(),
});

type InertiaVisitOptions = Parameters<typeof router.visit>[1];

const useBranch = (closeModal: () => void) => {
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
        code: '',
        name: '',
        address: '',
        phone: '',
        is_active: true,
    });

    const handleSubmit = async (branch?: IBranch) => {
        clearErrors();

        try {
            await BranchSchema.validate(data, { abortEarly: false });
            const submitOptions: InertiaVisitOptions = {
                onSuccess: () => {
                    reset();
                    toast.success(
                        branch
                            ? `Cabang: ${data.name} berhasil diupdate`
                            : `Cabang: ${data.name} berhasil ditambahkan`,
                    );
                    closeModal();
                },
                onError: () => {
                    toast.error('Terjadi kesalahan, periksa input Anda.');
                },
            };

            submit(branch ? update(branch.id) : store(), submitOptions);
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

export default useBranch;
