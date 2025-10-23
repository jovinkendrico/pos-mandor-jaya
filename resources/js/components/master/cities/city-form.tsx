import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import useCity from '@/hooks/use-city';
import { ICity } from '@/types';
import { useEffect } from 'react';
import InputError from '../../input-error';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface CityFormProps {
    city?: ICity;
    isModalOpen: boolean;
    onModalClose: () => void;
}

export default function CityForm(props: CityFormProps) {
    const { city, isModalOpen, onModalClose } = props;

    const {
        data,
        setData,
        errors,
        processing,
        reset,

        handleSubmit,
        handleCancel,
    } = useCity(onModalClose);

    useEffect(() => {
        if (city) {
            setData({
                name: city.name,
            });
        } else {
            reset();
        }
    }, [city, isModalOpen, reset, setData]);

    return (
        <Dialog open={isModalOpen} onOpenChange={onModalClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {city ? 'Edit Kota' : 'Tambah Kota'}
                    </DialogTitle>
                    <DialogDescription>
                        {city
                            ? 'Perbarui informasi kota di bawah.'
                            : 'Isi data detail untuk menambahkan kota baru'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(city);
                    }}
                    className="flex flex-col space-y-2"
                >
                    <div className="flex flex-col space-y-4 pb-4">
                        <div>
                            <Label htmlFor="name" required>
                                Nama Kota
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                className="input-box"
                            />
                            {errors.name && (
                                <InputError message={errors.name} />
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancel}
                            disabled={processing}
                            className="btn-secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="btn-primary"
                        >
                            {processing
                                ? 'Saving...'
                                : city
                                  ? 'Update Kota'
                                  : 'Tambah Kota'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
