import { store, update } from '@/routes/banks';
import { IBank } from '@/types';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const bankSchema = Yup.object().shape({
    name: Yup.string().required('Nama Bank/Cash harus diisi.'),
    type: Yup.string(),
    chart_of_account_id: Yup.string().nullable(),
    account_number: Yup.string(),
    account_name: Yup.string(),
    balance: Yup.number(),
    description: Yup.string(),
});

const useBanks = (closeModal: () => void) => {
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
        type: 'bank' as 'bank' | 'cash',
        chart_of_account_id: '' as string,
        account_number: '',
        account_name: '',
        balance: 0,
        description: '',
    });

    const handleSubmit = async (bank?: IBank) => {
        clearErrors();

        try {
            await bankSchema.validate(data, { abortEarly: false });

            submit(bank ? update(bank.id) : store(), {
                onSuccess: () => {
                    reset();
                    toast.success(
                        bank
                            ? `Bank/Cash: ${data.name} berhasil diupdate`
                            : `Bank/Cash: ${data.name} berhasil ditambahkan`,
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

export default useBanks;
