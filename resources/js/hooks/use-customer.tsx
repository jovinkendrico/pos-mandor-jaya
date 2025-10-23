import { destroy, store, update } from '@/routes/suppliers';
import { ICustomer } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

const useCustomer = (closeModal: () => void) => {
    const { data, setData, errors, processing, submit, reset } = useForm({
        name: '',
        address: '',
        city_id: '',
        phone_number: '',
        contact: '',
    });

    const handleSubmit = (customer?: ICustomer) => {
        submit(customer ? update(customer.id) : store(), {
            onSuccess: () => {
                reset();
                toast.success(
                    customer
                        ? 'Customer berhasil diupdate'
                        : 'Customer berhasil ditambahkan',
                );
                closeModal();
            },
            onError: () => {
                toast.error('Terjadi kesalahan, periksa input Anda.');
            },
        });
    };

    const handleDelete = (customer: ICustomer) => {
        router.delete(destroy(customer.id).url, {
            onSuccess: () => {
                toast.success('Customer berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus customer');
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

export default useCustomer;
