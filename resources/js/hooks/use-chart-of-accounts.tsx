import { AccountType } from '@/constants/enum';
import { destroy, store, update } from '@/routes/chart-of-accounts';
import { IChartOfAccount } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const AccountTypeValues = Object.values(AccountType);

const chartOfAccountSchema = Yup.object().shape({
    code: Yup.string().required('Kode akun harus diisi.'),
    name: Yup.string().required('Nama akun harus diisi.'),
    type: Yup.mixed<AccountType>()
        .oneOf(AccountTypeValues, 'Tipe akun tidak valid.')
        .required('Tipe akun harus diisi.'),
    parent_id: Yup.number().nullable(),
    description: Yup.string().nullable(),
    is_active: Yup.boolean(),
});

const useChartOfAccounts = (closeModal: () => void) => {
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
        type: 'asset' as
            | 'asset'
            | 'liability'
            | 'equity'
            | 'income'
            | 'expense',
        parent_id: null as number | null,
        description: '',
        is_active: true,
    });

    const handleSubmit = async (chartOfAccount?: IChartOfAccount) => {
        clearErrors();

        try {
            await chartOfAccountSchema.validate(data, { abortEarly: false });

            submit(chartOfAccount ? update(chartOfAccount.id) : store(), {
                onSuccess: () => {
                    reset();
                    toast.success(
                        chartOfAccount
                            ? `Chart of Account: ${data.name} berhasil diupdate`
                            : `Chart of Account: ${data.name} berhasil ditambahkan`,
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

    const handleDelete = (chartOfAccount: IChartOfAccount) => {
        router.delete(destroy(chartOfAccount.id).url, {
            onSuccess: () => {
                toast.success('Chart of Account berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus Chart of Account');
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

export default useChartOfAccounts;
