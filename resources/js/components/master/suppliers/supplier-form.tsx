import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import useCity from '@/hooks/use-city';
import useSupplier from '@/hooks/use-supplier';
import { ISupplier } from '@/types';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import InputError from '../../input-error';
import { Combobox, ComboboxOption } from '../../ui/combobox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

interface City {
    id: number;
    name: string;
}

interface SupplierFormProps {
    supplier?: ISupplier;
    cities: City[];
    isModalOpen: boolean;
    onModalClose: () => void;
}

export default function SupplierForm(props: SupplierFormProps) {
    const { supplier, cities, isModalOpen, onModalClose } = props;

    const [isAddCityModalOpen, setIsAddCityModalOpen] = useState(false);
    const [localCities, setLocalCities] = useState<City[]>(cities);

    const {
        data: dataSupplier,
        setData: setDataSupplier,
        errors: errorsSupplier,
        processing: processingSupplier,
        reset: resetSupplier,
        handleSubmit: handleSubmitSupplier,
        handleCancel: handleCancelSupplier,
    } = useSupplier(onModalClose);

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
        if (supplier) {
            setDataSupplier({
                name: supplier.name,
                address: supplier.address || '',
                city_id: supplier.city_id ? supplier.city_id.toString() : '',
                phone_number: supplier.phone_number || '',
                contact: supplier.contact || '',
            });
        } else {
            resetSupplier();
        }
    }, [supplier, isModalOpen, resetSupplier, setDataSupplier]);

    const cityOptions: ComboboxOption[] = useMemo(() => {
        return localCities.map((city) => ({
            value: city.id.toString(),
            label: city.name,
        }));
    }, [localCities]);

    return (
        <Dialog open={isModalOpen} onOpenChange={onModalClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {supplier ? 'Edit Supplier' : 'Tambah Supplier'}
                    </DialogTitle>
                    <DialogDescription>
                        {supplier
                            ? 'Perbarui informasi supplier di bawah.'
                            : 'Isi data detail untuk menambahkan supplier baru'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    className="flex flex-col space-y-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitSupplier(supplier);
                    }}
                >
                    <div className="flex flex-col space-y-4 pb-4">
                        <div>
                            <Label htmlFor="name" required>
                                Nama Supplier
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={dataSupplier.name}
                                onChange={(e) =>
                                    setDataSupplier('name', e.target.value)
                                }
                                className="input-box"
                            />
                            {errorsSupplier.name && (
                                <InputError message={errorsSupplier.name} />
                            )}
                        </div>

                        <div>
                            <Label htmlFor="address">Alamat</Label>
                            <Textarea
                                id="address"
                                name="address"
                                value={dataSupplier.address}
                                onChange={(e) =>
                                    setDataSupplier('address', e.target.value)
                                }
                                rows={3}
                                className="input-box"
                            />
                            {errorsSupplier.address && (
                                <InputError message={errorsSupplier.address} />
                            )}
                        </div>

                        <div className="flex flex-row gap-4">
                            <div className="w-1/2">
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor="city_id">Kota</Label>
                                        <Combobox
                                            options={cityOptions}
                                            value={dataSupplier.city_id}
                                            onValueChange={(value) =>
                                                setDataSupplier(
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
                                        {errorsSupplier.city_id && (
                                            <InputError
                                                message={errorsSupplier.city_id}
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
                                    value={dataSupplier.phone_number}
                                    onChange={(e) =>
                                        setDataSupplier(
                                            'phone_number',
                                            e.target.value,
                                        )
                                    }
                                    className="input-box"
                                />
                                {errorsSupplier.phone_number && (
                                    <InputError
                                        message={errorsSupplier.phone_number}
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="contact">Contact Person</Label>
                            <Input
                                id="contact"
                                name="contact"
                                value={dataSupplier.contact}
                                onChange={(e) =>
                                    setDataSupplier('contact', e.target.value)
                                }
                                className="input-box"
                            />
                            {errorsSupplier.contact && (
                                <InputError message={errorsSupplier.contact} />
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancelSupplier}
                            disabled={processingSupplier}
                            className="btn-secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processingSupplier}
                            className="btn-primary"
                        >
                            {processingSupplier ? (
                                <Spinner />
                            ) : supplier ? (
                                'Update Supplier'
                            ) : (
                                'Tambah Supplier'
                            )}
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
