import { destroy } from '@/routes/suppliers';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';

interface Supplier {
    id: number;
    name: string;
}

interface SupplierDeleteConfirmationProps {
    supplier: Supplier | null;
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function SupplierDeleteConfirmation({ supplier, isModalOpen, onOpenChange }: SupplierDeleteConfirmationProps) {
    if (!supplier) return null;

    const handleDelete = () => {
        router.delete(destroy(supplier.id).url, {
            onSuccess: () => {
                onOpenChange(false);
                toast.success('Supplier berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus supplier');
            },
        });
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus {supplier.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Apakah Anda yakin ingin menghapus supplier <span className="font-extrabold">{supplier.name}</span>?
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

