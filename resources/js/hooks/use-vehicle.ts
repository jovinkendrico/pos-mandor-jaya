import { IVehicle } from '@/types';
import { useForm } from '@inertiajs/react';

export default function useVehicle(onModalClose: () => void) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            police_number: '',
            name: '',
            driver: '',
            is_active: true,
            description: '',
        });

    const handleSubmit = (vehicle?: IVehicle) => {
        if (vehicle) {
            put(`/vehicles/${vehicle.id}`, {
                onSuccess: () => {
                    onModalClose();
                    reset();
                    clearErrors();
                },
            });
        } else {
            post('/vehicles', {
                onSuccess: () => {
                    onModalClose();
                    reset();
                    clearErrors();
                },
            });
        }
    };

    const handleCancel = () => {
        onModalClose();
        reset();
        clearErrors();
    };

    return {
        data,
        setData,
        errors,
        processing,
        reset,
        clearErrors,
        handleSubmit,
        handleCancel,
    };
}
