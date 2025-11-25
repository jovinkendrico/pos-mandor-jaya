import { store, update } from '@/routes/customers';
import { ICustomer } from '@/types';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import * as Yup from 'yup';

const indoPhoneRegex = /^\+62\d{9,13}$/;
const customerSchema = Yup.object().shape({
    name: Yup.string().required('Nama Bank/Cash harus diisi.'),
    address: Yup.string().max(255, 'Maksimal 255 karakter.'),
    city_id: Yup.string(),
    phone_number: Yup.string()
        .nullable()
        .test(
            'starts-with-plus-62',
            'Nomor telepon harus dimulai dengan +62',
            (value) => {
                if (!value) {
                    return true;
                }
                return indoPhoneRegex.test(value);
            },
        ),
    contact: Yup.string(),
});

const useCustomer = (closeModal: () => void) => {
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
        address: '',
        city_id: '',
        phone_number: '',
        contact: '',
    });

    const handleSubmit = async (customer?: ICustomer) => {
        clearErrors();

        try {
            await customerSchema.validate(data, { abortEarly: false });

            submit(customer ? update(customer.id) : store(), {
                onSuccess: () => {
                    reset();
                    toast.success(
                        customer
                            ? `Customer: ${data.name} berhasil diupdate`
                            : `Customer ${data.name} berhasil ditambahkan`,
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

export default useCustomer;
