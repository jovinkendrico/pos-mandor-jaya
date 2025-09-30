import { Button } from '@/components/ui/button';
import { destroy } from '@/routes/roles';
import { Role } from '@/types';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

interface BranchDeleteConfirmationProps {
    role: Role | null;
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function RoleDeleteConfirmation({ role, isModalOpen, onOpenChange }: BranchDeleteConfirmationProps) {
    if (!role) {
        return null;
    }

    const handleDelete = () => {
        router.delete(destroy(role.id), {
            onSuccess: () => {
                onOpenChange(false);
                toast.success('Role berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus role');
            },
        });
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Apakah Anda yakin?</DialogTitle>
                    <DialogDescription>
                        Tindakan ini tidak dapat diubah. Ini akan menghapus permanen role <strong>{role?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
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
