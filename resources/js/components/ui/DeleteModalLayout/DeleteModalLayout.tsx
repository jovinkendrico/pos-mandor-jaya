import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../dialog';
import { Spinner } from '../spinner';

interface DeleteModalLayoutProps<T> {
    dataId: number | undefined;
    dataName: string | undefined;
    dataType: string;
    isModalOpen: boolean;
    onModalClose: () => void;
    setSelected: (selected: T | undefined) => void;
    getDeleteUrl: (id: number) => string;
}

const DeleteModalLayout = <T,>(props: DeleteModalLayoutProps<T>) => {
    const [isLoading, setIsLoading] = useState(false);

    if (!props.dataName || !props.dataId) return null;

    const {
        dataId,
        dataName,
        dataType,
        isModalOpen,
        onModalClose,
        setSelected,
        getDeleteUrl,
    } = props;

    const handleDelete = () => {
        router.delete(getDeleteUrl(dataId), {
            onStart: () => {
                setIsLoading(true);
            },
            onSuccess: () => {
                setIsLoading(false);
                onModalClose();
                toast.success(`${dataType}: ${dataName} berhasil dihapus`);
                setSelected(undefined);
            },
            onError: () => {
                setIsLoading(false);
                onModalClose();
                toast.error(`Gagal menghapus ${dataType}`);
            },
        });
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onModalClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus {dataName}?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm font-extralight">
                        Apakah Anda yakin ingin menghapus {dataType}:{' '}
                        <span className="font-extrabold">{dataName}</span>?
                    </p>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onModalClose}
                        className="btn-secondary"
                        disabled={isLoading}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={handleDelete}
                        className="btn-danger"
                        disabled={isLoading}
                    >
                        {isLoading ? <Spinner /> : 'Hapus'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteModalLayout;
