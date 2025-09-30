import { destroy } from '@/routes/users';
import { User } from '@/types';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

interface PageProps {
    user: User | null;
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function UserDeleteConfirmation({ user, isModalOpen, onOpenChange }: PageProps) {
    if (!user) return null;

    const handleDelete = () => {
        router.delete(destroy(user.id), {
            onSuccess: () => {
                onOpenChange(false);
                toast.success('User berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus user');
            },
        });
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus {user.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Apakah Anda yakin ingin menghapus user <span className="font-extrabold">{user.name}</span>?
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
