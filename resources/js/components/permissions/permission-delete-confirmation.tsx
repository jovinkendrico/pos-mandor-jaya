import { Button } from '@/components/ui/button';
import { destroy } from '@/routes/permissions';
import { Permission } from '@/types';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

interface PageProps {
    permission: Permission | null;
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function PermissionDeleteConfirmation({ permission, isModalOpen, onOpenChange }: PageProps) {
    if (!permission) {
        return null;
    }

    const handleDelete = () => {
        router.delete(destroy(permission.id), {
            onSuccess: () => {
                onOpenChange(false);
                toast.success('Permission berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus permission');
            },
        });
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus {permission.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Apakah Anda yakin ingin menghapus izin <span className="font-extrabold">{permission.name}</span>?<br />
                        Tindakan ini tidak dapat diubah dan akan secara permanen menghapus izin tersebut.
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
