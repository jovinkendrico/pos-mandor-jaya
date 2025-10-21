import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UOM } from '@/types';
import { useForm } from '@inertiajs/react';

interface UOMFormProps {
    isModalOpen: boolean;
    onOpenChange: (open: boolean) => void;
    uom?: UOM;
}

const UOMForm = (props: UOMFormProps) => {
    const { isModalOpen, onOpenChange, uom } = props;

    const form = useForm({
        name: '',
    });

    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{uom ? 'Edit UOM' : 'Tambah UOM'}</DialogTitle>
                    <DialogDescription>
                        {uom
                            ? 'Perbarui informasi UOM'
                            : 'Isi data detail untuk menambahkan UOM baru'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={() => {}} className="flex flex-col space-y-2">
                    <Label htmlFor="name">Nama UOM</Label>
                    <Input
                        id="name"
                        name="name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                    />
                    <Button
                        type="submit"
                        variant="outline"
                        size="icon"
                        onClick={() => {}}
                    >
                        Simpan
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UOMForm;
