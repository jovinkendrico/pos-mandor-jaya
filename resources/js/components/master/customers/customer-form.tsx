import { store, update } from '@/routes/customers';
import { store as storeCity } from '@/routes/cities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import InputError from '../../input-error';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Combobox, ComboboxOption } from '../../ui/combobox';
import { Plus } from 'lucide-react';
import axios from 'axios';

interface City {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    address?: string;
    city_id?: number;
    phone_number?: string;
    contact?: string;
}

interface CustomerFormProps {
    customer?: Customer | null;
    cities: City[];
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function CustomerForm({ customer, cities, isModalOpen, onOpenChange }: CustomerFormProps) {
    const [isAddCityModalOpen, setIsAddCityModalOpen] = useState(false);
    const [localCities, setLocalCities] = useState<City[]>(cities);
    const [newCityName, setNewCityName] = useState('');
    const [isAddingCity, setIsAddingCity] = useState(false);

    const form = useForm({
        name: '',
        address: '',
        city_id: '',
        phone_number: '',
        contact: '',
    });

    useEffect(() => {
        setLocalCities(cities);
    }, [cities]);

    useEffect(() => {
        if (customer) {
            form.setData({
                name: customer.name,
                address: customer.address || '',
                city_id: customer.city_id ? customer.city_id.toString() : '',
                phone_number: customer.phone_number || '',
                contact: customer.contact || '',
            });
        } else {
            form.reset();
        }
    }, [customer, isModalOpen]);

    const cityOptions: ComboboxOption[] = useMemo(() => {
        return localCities.map((city) => ({
            value: city.id.toString(),
            label: city.name,
        }));
    }, [localCities]);

    const handleAddCity = async () => {
        if (!newCityName.trim()) {
            toast.error('Nama kota tidak boleh kosong');
            return;
        }

        setIsAddingCity(true);

        try {
            // Using axios which automatically handles CSRF token from cookies
            const response = await axios.post(storeCity().url, {
                name: newCityName,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (response.data && response.data.data) {
                const newCity = response.data.data;

                setLocalCities((prev) => [...prev, newCity]);
                form.setData('city_id', newCity.id.toString());
                toast.success('Kota berhasil ditambahkan');
                setNewCityName('');
                setIsAddCityModalOpen(false);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.response?.data?.errors?.name?.[0] || 'Gagal menambahkan kota';
            toast.error(errorMessage);
        } finally {
            setIsAddingCity(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.submit(customer ? update(customer.id) : store(), {
            onSuccess: () => {
                form.reset();
                toast.success(customer ? 'Customer berhasil diupdate' : 'Customer berhasil ditambahkan');
                onOpenChange(false);
            },
            onError: () => {
                toast.error('Terjadi kesalahan, periksa input Anda.');
            },
        });
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{customer ? 'Edit Customer' : 'Tambah Customer'}</DialogTitle>
                    <DialogDescription>
                        {customer ? 'Perbarui informasi customer di bawah.' : 'Isi data detail untuk menambahkan customer baru'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
                    <div className="flex flex-col space-y-4 pb-4">
                        <div>
                            <Label htmlFor="name" required>
                                Nama Customer
                            </Label>
                            <Input id="name" name="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                            {form.errors.name && <InputError message={form.errors.name} />}
                        </div>

                        <div>
                            <Label htmlFor="address">Alamat</Label>
                            <Textarea
                                id="address"
                                name="address"
                                value={form.data.address}
                                onChange={(e) => form.setData('address', e.target.value)}
                                rows={3}
                            />
                            {form.errors.address && <InputError message={form.errors.address} />}
                        </div>

                        <div className="flex flex-row gap-4">
                            <div className="w-1/2">
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor="city_id">Kota</Label>
                                        <Combobox
                                            options={cityOptions}
                                            value={form.data.city_id}
                                            onValueChange={(value) => form.setData('city_id', value)}
                                            placeholder="Pilih atau cari kota..."
                                            searchPlaceholder="Cari kota..."
                                            emptyText="Kota tidak ditemukan"
                                            className="w-full"
                                            maxDisplayItems={10}
                                        />
                                        {form.errors.city_id && <InputError message={form.errors.city_id} />}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setIsAddCityModalOpen(true)}
                                        title="Tambah kota baru"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="w-1/2">
                                <Label htmlFor="phone_number">Nomor Telepon</Label>
                                <Input
                                    id="phone_number"
                                    name="phone_number"
                                    value={form.data.phone_number}
                                    onChange={(e) => form.setData('phone_number', e.target.value)}
                                />
                                {form.errors.phone_number && <InputError message={form.errors.phone_number} />}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="contact">Contact Person</Label>
                            <Input
                                id="contact"
                                name="contact"
                                value={form.data.contact}
                                onChange={(e) => form.setData('contact', e.target.value)}
                            />
                            {form.errors.contact && <InputError message={form.errors.contact} />}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={form.processing}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving...' : customer ? 'Update Customer' : 'Tambah Customer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>

            {/* Dialog for adding new city */}
            <Dialog open={isAddCityModalOpen} onOpenChange={setIsAddCityModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Kota Baru</DialogTitle>
                        <DialogDescription>Masukkan nama kota yang ingin ditambahkan</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="new_city_name">Nama Kota</Label>
                        <Input
                            id="new_city_name"
                            value={newCityName}
                            onChange={(e) => setNewCityName(e.target.value)}
                            placeholder="Masukkan nama kota"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCity();
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIsAddCityModalOpen(false);
                                setNewCityName('');
                            }}
                            disabled={isAddingCity}
                        >
                            Batal
                        </Button>
                        <Button type="button" onClick={handleAddCity} disabled={isAddingCity}>
                            {isAddingCity ? 'Menambahkan...' : 'Tambah Kota'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}

