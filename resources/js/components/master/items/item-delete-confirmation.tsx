import { destroy } from '@/routes/items';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Item {
    id: number;
    code: string;
    name: string;
}

interface ItemDeleteConfirmationProps {
    item: Item | null;
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function ItemDeleteConfirmation({ item, isModalOpen, onOpenChange }: ItemDeleteConfirmationProps) {
    if (!item) return null;

    const handleDelete = () => {
        router.delete(destroy(item.id).url, {
            onSuccess: () => {
                onOpenChange(false);
                toast.success('Barang berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus barang');
            },
        });
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus {item.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Apakah Anda yakin ingin menghapus barang <span className="font-extrabold">{item.name}</span> ({item.code})?
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

