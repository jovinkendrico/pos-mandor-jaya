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
import useCustomer from '@/hooks/use-customer';
import { ICity, ICustomer } from '@/types';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import InputError from '../../input-error';
import { Combobox, ComboboxOption } from '../../ui/combobox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

interface CustomerFormProps {
    customer?: ICustomer;
    cities: ICity[];
    isModalOpen: boolean;
    onModalClose: () => void;
}

export default function CustomerForm(props: CustomerFormProps) {
    const { customer, cities, isModalOpen, onModalClose } = props;

    const [isAddCityModalOpen, setIsAddCityModalOpen] = useState(false);
    const [localCities, setLocalCities] = useState<ICity[]>(cities);

    const {
        data: dataCustomer,
        setData: setDataCustomer,
        errors: errorsCustomer,
        processing: processingCustomer,
        reset: resetCustomer,
        handleSubmit: handleSubmitCustomer,
        handleCancel: handleCancelCustomer,
    } = useCustomer(onModalClose);

    const {
        setData: setDataCity,
        errors: errorsCity,
        processing: processingCity,
        handleSubmit: handleSubmitCity,
        handleCancel: handleCancelCity,
    } = useCity(() => setIsAddCityModalOpen(false));

    useEffect(() => {
        setLocalCities(cities);
    }, [cities]);

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

    const cityOptions: ComboboxOption[] = useMemo(() => {
        return localCities.map((city) => ({
            value: city.id.toString(),
            label: city.name,
        }));
    }, [localCities]);

    // const handleAddCity = async () => {
    //     if (!newCityName.trim()) {
    //         toast.error('Nama kota tidak boleh kosong');
    //         return;
    //     }

    //     setIsAddingCity(true);

    //     try {
    //         // Using axios which automatically handles CSRF token from cookies
    //         const response = await axios.post(
    //             storeCity().url,
    //             {
    //                 name: newCityName,
    //             },
    //             {
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                     Accept: 'application/json',
    //                 },
    //             },
    //         );

    //         if (response.data && response.data.data) {
    //             const newCity = response.data.data;

    //             setLocalCities((prev) => [...prev, newCity]);
    //             setData('city_id', newCity.id.toString());
    //             toast.success('Kota berhasil ditambahkan');
    //             setNewCityName('');
    //             setIsAddCityModalOpen(false);
    //         }
    //     } catch (error: unknown) {
    //         const errorMessage =
    //             error.response?.data?.message ||
    //             error.response?.data?.errors?.name?.[0] ||
    //             'Gagal menambahkan kota';
    //         toast.error(errorMessage);
    //     } finally {
    //         setIsAddingCity(false);
    //     }
    // };

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
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor="city_id">Kota</Label>
                                        <Combobox
                                            options={cityOptions}
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
                                            className="w-full"
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

            {/* Dialog for adding new city */}
            <Dialog
                open={isAddCityModalOpen}
                onOpenChange={setIsAddCityModalOpen}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Kota Baru</DialogTitle>
                        <DialogDescription>
                            Masukkan nama kota yang ingin ditambahkan
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="flex flex-col space-y-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmitCity();
                        }}
                    >
                        <div className="py-4">
                            <Label htmlFor="new_city_name">Nama Kota</Label>
                            <Input
                                id="new_city_name"
                                onChange={(e) =>
                                    setDataCity('name', e.target.value)
                                }
                                placeholder="Masukkan nama kota"
                            />
                            {errorsCity.name && (
                                <InputError message={errorsCity.name} />
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleCancelCity}
                                disabled={processingCity}
                                className="btn-secondary"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processingCity}
                                className="btn-primary"
                            >
                                {processingCity
                                    ? 'Menambahkan...'
                                    : 'Tambah Kota'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
