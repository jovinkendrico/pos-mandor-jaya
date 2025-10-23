import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useUOM from '@/hooks/use-uom';
import { UOM } from '@/types';
import { useEffect } from 'react';

interface UOMFormProps {
    uom?: UOM;
    isModalOpen: boolean;
    onModalClose: () => void;
}

const UOMForm = (props: UOMFormProps) => {
    const { uom, isModalOpen, onModalClose } = props;

    const {
        data,
        setData,
        errors,
        processing,
        reset,
        handleSubmit,
        handleCancel,
    } = useUOM(onModalClose);

    useEffect(() => {
        if (isModalOpen && uom) {
            setData('name', uom.name);
        } else {
            reset();
        }
    }, [isModalOpen, uom, setData, reset]);

    return (
        <Dialog open={isModalOpen} onOpenChange={onModalClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{uom ? 'Edit UOM' : 'Tambah UOM'}</DialogTitle>
                    <DialogDescription>
                        {uom
                            ? 'Perbarui informasi UOM'
                            : 'Isi data detail untuk menambahkan UOM baru'}
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="flex flex-col space-y-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(uom);
                    }}
                >
                    <Label htmlFor="name">Nama UOM</Label>
                    <Input
                        id="name"
                        name="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="input-box"
                    />
                    {errors.name && <InputError message={errors.name} />}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancel}
                            className="btn-secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="btn-primary"
                        >
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UOMForm;
