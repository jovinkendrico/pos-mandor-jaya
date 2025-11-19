import { Button } from '../button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../dialog';
import { Spinner } from '../spinner';

interface PropTypes {
    titleDesc?: string;
    contentDesc?: string;
    submitText?: string;
    isLoading?: boolean;
    isModalOpen: boolean;
    onModalClose: () => void;
    handleSubmit: () => void;
}

const Modal = (props: PropTypes) => {
    const {
        titleDesc,
        contentDesc,
        submitText,
        isLoading,
        isModalOpen,
        onModalClose,
        handleSubmit,
    } = props;
    return (
        <Dialog open={isModalOpen} onOpenChange={onModalClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{titleDesc}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm font-extralight">{contentDesc}</p>
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
                        onClick={handleSubmit}
                        className="btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? <Spinner /> : `${submitText}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default Modal;
