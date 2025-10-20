import { destroy } from '@/routes/cities';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';

interface City {
    id: number;
    name: string;
}

interface CityDeleteConfirmationProps {
    city: City | null;
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function CityDeleteConfirmation({ city, isModalOpen, onOpenChange }: CityDeleteConfirmationProps) {
    if (!city) return null;

    const handleDelete = () => {
        router.delete(destroy(city.id).url, {
            onSuccess: () => {
                onOpenChange(false);
                toast.success('Kota berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus kota');
            },
        });
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus {city.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Apakah Anda yakin ingin menghapus kota <span className="font-extrabold">{city.name}</span>?
                    </p>
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        Hapus
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

