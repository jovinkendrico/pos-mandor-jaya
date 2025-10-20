import { store, update } from '@/routes/cities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import InputError from '../../input-error';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface City {
    id: number;
    name: string;
}

interface CityFormProps {
    city?: City | null;
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function CityForm({ city, isModalOpen, onOpenChange }: CityFormProps) {
    const form = useForm({
        name: '',
    });

    useEffect(() => {
        if (city) {
            form.setData({
                name: city.name,
            });
        } else {
            form.reset();
        }
    }, [city, isModalOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.submit(city ? update(city.id) : store(), {
            onSuccess: () => {
                form.reset();
                toast.success(city ? 'Kota berhasil diupdate' : 'Kota berhasil ditambahkan');
                onOpenChange(false);
            },
            onError: () => {
                toast.error('Terjadi kesalahan, periksa input Anda.');
            },
        });
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{city ? 'Edit Kota' : 'Tambah Kota'}</DialogTitle>
                    <DialogDescription>
                        {city ? 'Perbarui informasi kota di bawah.' : 'Isi data detail untuk menambahkan kota baru'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
                    <div className="flex flex-col space-y-4 pb-4">
                        <div>
                            <Label htmlFor="name" required>
                                Nama Kota
                            </Label>
                            <Input id="name" name="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                            {form.errors.name && <InputError message={form.errors.name} />}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={form.processing}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving...' : city ? 'Update Kota' : 'Tambah Kota'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

