import { destroy } from '@/routes/customers';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';

interface Customer {
    id: number;
    name: string;
}

interface CustomerDeleteConfirmationProps {
    customer: Customer | null;
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function CustomerDeleteConfirmation({ customer, isModalOpen, onOpenChange }: CustomerDeleteConfirmationProps) {
    if (!customer) return null;

    const handleDelete = () => {
        router.delete(destroy(customer.id).url, {
            onSuccess: () => {
                onOpenChange(false);
                toast.success('Customer berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus customer');
            },
        });
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus {customer.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Apakah Anda yakin ingin menghapus customer <span className="font-extrabold">{customer.name}</span>?
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

