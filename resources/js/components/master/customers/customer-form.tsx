import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import useCustomer from '@/hooks/use-customer';
import { ICustomer } from '@/types';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from '../../input-error';
import { Combobox, ComboboxOption } from '../../ui/combobox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import CityForm from '../cities/city-form';

interface CustomerFormProps {
    customer?: ICustomer;
    isModalOpen: boolean;
    onModalClose: () => void;
    cityComboboxOption: ComboboxOption[];
}

export default function CustomerForm(props: CustomerFormProps) {
    const { customer, isModalOpen, onModalClose, cityComboboxOption } = props;

    const [isAddCityModalOpen, setIsAddCityModalOpen] = useState(false);

    const {
        data: dataCustomer,
        setData: setDataCustomer,
        errors: errorsCustomer,
        processing: processingCustomer,
        reset: resetCustomer,
        handleSubmit: handleSubmitCustomer,
        handleCancel: handleCancelCustomer,
    } = useCustomer(onModalClose);

    useEffect(() => {
        if (customer) {
            setDataCustomer({
                name: customer.name,
                address: customer.address || '',
                city_id: customer.city_id ? customer.city_id.toString() : '',
                phone_number: customer.phone_number || '',
                contact: customer.contact || '',
            });
        } else {
            resetCustomer();
        }
    }, [customer, isModalOpen, resetCustomer, setDataCustomer]);

    return (
        <Dialog open={isModalOpen} onOpenChange={onModalClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {customer ? 'Edit Customer' : 'Tambah Customer'}
                    </DialogTitle>
                    <DialogDescription>
                        {customer
                            ? 'Perbarui informasi customer di bawah.'
                            : 'Isi data detail untuk menambahkan customer baru'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitCustomer(customer);
                    }}
                    className="flex flex-col space-y-2"
                >
                    <div className="flex flex-col space-y-4 pb-4">
                        <div>
                            <Label htmlFor="name" required>
                                Nama Customer
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={dataCustomer.name}
                                onChange={(e) =>
                                    setDataCustomer('name', e.target.value)
                                }
                                className="input-box"
                            />
                            {errorsCustomer.name && (
                                <InputError message={errorsCustomer.name} />
                            )}
                        </div>

                        <div>
                            <Label htmlFor="address">Alamat</Label>
                            <Textarea
                                id="address"
                                name="address"
                                value={dataCustomer.address}
                                onChange={(e) =>
                                    setDataCustomer('address', e.target.value)
                                }
                                rows={3}
                                className="input-box"
                            />
                            {errorsCustomer.address && (
                                <InputError message={errorsCustomer.address} />
                            )}
                        </div>

                        <div className="flex flex-row gap-4">
                            <div className="w-1/2">
                                <div className="flex flex-col gap-2 md:flex-row md:items-end">
                                    <div className="flex-1">
                                        <Label htmlFor="city_id">Kota</Label>
                                        <Combobox
                                            options={cityComboboxOption}
                                            value={dataCustomer.city_id}
                                            onValueChange={(value) =>
                                                setDataCustomer(
                                                    'city_id',
                                                    value,
                                                )
                                            }
                                            placeholder="Pilih atau cari kota..."
                                            searchPlaceholder="Cari kota..."
                                            emptyText="Kota tidak ditemukan"
                                            className="w-full dark:!bg-white dark:!text-primary-200"
                                            maxDisplayItems={10}
                                        />
                                        {errorsCustomer.city_id && (
                                            <InputError
                                                message={errorsCustomer.city_id}
                                            />
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() =>
                                            setIsAddCityModalOpen(true)
                                        }
                                        title="Tambah kota baru"
                                        className="btn-secondary"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="w-1/2">
                                <Label htmlFor="phone_number">
                                    Nomor Telepon
                                </Label>
                                <Input
                                    id="phone_number"
                                    name="phone_number"
                                    value={dataCustomer.phone_number}
                                    onChange={(e) =>
                                        setDataCustomer(
                                            'phone_number',
                                            e.target.value,
                                        )
                                    }
                                    className="input-box"
                                />
                                {errorsCustomer.phone_number && (
                                    <InputError
                                        message={errorsCustomer.phone_number}
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="contact">Contact Person</Label>
                            <Input
                                id="contact"
                                name="contact"
                                value={dataCustomer.contact}
                                onChange={(e) =>
                                    setDataCustomer('contact', e.target.value)
                                }
                                className="input-box"
                            />
                            {errorsCustomer.contact && (
                                <InputError message={errorsCustomer.contact} />
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancelCustomer}
                            disabled={processingCustomer}
                            className="btn-secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processingCustomer}
                            className="btn-primary"
                        >
                            {processingCustomer
                                ? 'Saving...'
                                : customer
                                  ? 'Update Customer'
                                  : 'Tambah Customer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
            <CityForm
                isModalOpen={isAddCityModalOpen}
                onModalClose={() => setIsAddCityModalOpen(false)}
                isNested
            />
        </Dialog>
    );
}
