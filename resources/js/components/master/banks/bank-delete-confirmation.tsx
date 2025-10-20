import { destroy } from '@/routes/banks';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../ui/dialog';

interface Bank {
    id: number;
    name: string;
}

interface BankDeleteConfirmationProps {
    bank: Bank | null;
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const BankDeleteConfirmation = (props: BankDeleteConfirmationProps) => {
    const { bank, isModalOpen, onOpenChange } = props;

    if (!bank) return null;

    const handleDelete = () => {
        router.delete(destroy(bank.id).url, {
            onSuccess: () => {
                onOpenChange(false);
                toast.success('Bank/Cash berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus bank/cash');
            },
        });
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus {bank.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Apakah Anda yakin ingin menghapus bank/cash{' '}
                        <span className="font-extrabold">{bank.name}</span>?
                    </p>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        Hapus
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BankDeleteConfirmation;
