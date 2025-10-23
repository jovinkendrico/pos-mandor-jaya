import { router  } from "@inertiajs/react";
import { Button } from "../button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../dialog";
import { toast } from "sonner";

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
    if (!props.dataName || !props.dataId) return null;

    const { dataId, dataName, dataType, isModalOpen, onModalClose, setSelected, getDeleteUrl } = props;


    const handleDelete = () => {
        router.delete(getDeleteUrl(dataId), {
            onSuccess: () => {
                onModalClose();
                toast.success(`${dataType}: ${dataName} berhasil dihapus`);
                setSelected(undefined);
            },
            onError: () => {
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
                        Apakah Anda yakin ingin menghapus {dataType}: <span className="font-extrabold">{dataName}</span>?
                    </p>
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onModalClose} className="btn-secondary">
                        Batal
                    </Button>
                    <Button type="button" onClick={handleDelete} className="btn-danger">
                        Hapus
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default DeleteModalLayout