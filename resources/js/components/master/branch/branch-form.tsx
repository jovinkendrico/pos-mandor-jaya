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
import { Switch } from '@/components/ui/switch';
import useBranch from '@/hooks/use-branch';
import { IBranch } from '@/types';
import { useEffect } from 'react';

interface BranchFormProps {
    branch?: IBranch;
    isModalOpen: boolean;
    onModalClose: () => void;
}

const BranchForm = (props: BranchFormProps) => {
    const { branch, isModalOpen, onModalClose } = props;

    const {
        data,
        setData,
        errors,
        processing,
        reset,
        handleSubmit,
        handleCancel,
    } = useBranch(onModalClose);

    useEffect(() => {
        if (isModalOpen && branch) {
            setData((prev) => ({
                ...prev,
                code: branch.code,
                name: branch.name,
                address: branch.address || '',
                phone: branch.phone || '',
                is_active: branch.is_active,
            }));
        } else {
            reset();
        }
    }, [isModalOpen, branch, reset]);

    return (
        <Dialog open={isModalOpen} onOpenChange={onModalClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{branch ? 'Edit Cabang' : 'Tambah Cabang'}</DialogTitle>
                    <DialogDescription>
                        {branch
                            ? 'Perbarui informasi Cabang'
                            : 'Isi data detail untuk menambahkan Cabang baru'}
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="flex flex-col space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(branch);
                    }}
                >
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="code">Kode Cabang</Label>
                        <Input
                            id="code"
                            name="code"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            className="input-box"
                            placeholder="Contoh: PST"
                        />
                        {errors.code && <InputError message={errors.code} />}
                    </div>

                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="name">Nama Cabang</Label>
                        <Input
                            id="name"
                            name="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="input-box"
                            placeholder="Contoh: Pusat (Headquarters)"
                        />
                        {errors.name && <InputError message={errors.name} />}
                    </div>

                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="address">Alamat</Label>
                        <Input
                            id="address"
                            name="address"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            className="input-box"
                        />
                        {errors.address && <InputError message={errors.address} />}
                    </div>

                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="phone">Telepon</Label>
                        <Input
                            id="phone"
                            name="phone"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="input-box"
                        />
                        {errors.phone && <InputError message={errors.phone} />}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked)}
                        />
                        <Label htmlFor="is_active">Aktif</Label>
                    </div>

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

export default BranchForm;
