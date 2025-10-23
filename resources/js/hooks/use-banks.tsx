import { destroy, store, update } from '@/routes/banks';
import { IBank, ICity } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

const useBanks = (closeModal: () => void) => {
    const { data, setData, errors, processing, submit, reset } = useForm({
        name: '',
        type: 'bank' as 'bank' | 'cash',
        account_number: '',
        account_name: '',
        balance: 0,
        description: '',
    });

    const handleSubmit = (bank?: IBank) => {
        submit(bank ? update(bank.id) : store(), {
            onSuccess: () => {
                reset();
                toast.success(
                    bank
                        ? 'Bank/Cash berhasil diupdate'
                        : 'Bank/Cash berhasil ditambahkan',
                );
                closeModal();
            },
            onError: () => {
                toast.error('Terjadi kesalahan, periksa input Anda.');
            },
        });
    };

    const handleDelete = (bank: ICity) => {
        router.delete(destroy(bank.id).url, {
            onSuccess: () => {
                toast.success('Bank/Cash berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus Bank/Cash');
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

export default useBanks;
