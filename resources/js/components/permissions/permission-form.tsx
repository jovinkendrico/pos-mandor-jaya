import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { store, update } from '@/routes/permissions';
import { Permission } from '@/types';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface PageProps {
    permission: Permission | null;
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function PermissionForm({ permission, isModalOpen, onOpenChange }: PageProps) {
    const form = useForm({
        name: '',
        guard_name: 'web',
        group: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.submit(permission ? update(permission.id) : store(), {
            onSuccess: () => {
                form.reset();
                toast.success(permission ? 'Permission berhasil diperbarui' : 'Permission berhasil ditambahkan');
                onOpenChange(false);
            },
            onError: () => {
                toast.error('Gagal menyimpan permission');
            },
        });
    };

    useEffect(() => {
        if (permission) {
            form.setData({
                name: permission.name,
                guard_name: permission.guard_name,
                group: permission.group,
            });
        } else {
            form.reset();
        }
    }, [isModalOpen, permission]);

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{permission ? 'Edit Permission' : 'Tambah Permission'}</DialogTitle>
                    <DialogDescription>
                        {permission ? 'Perbarui informasi permission di bawah.' : 'Isi data detail untuk menambahkan permission baru'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="mb-7 flex flex-col space-y-4">
                        <div>
                            <Label htmlFor="name">Nama</Label>
                            <Input id="name" name="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                            {form.errors.name && <InputError message={form.errors.name} />}
                        </div>

                        <div>
                            <Label htmlFor="group">Grup</Label>
                            <Input
                                id="group"
                                name="group"
                                value={form.data.group}
                                onChange={(e) => form.setData('group', e.target.value)}
                                placeholder="Contoh: users, roles, permissions"
                            />
                            {form.errors.group && <InputError message={form.errors.group} />}
                        </div>

                        <div>
                            <Label htmlFor="guard_name">Guard</Label>
                            <Select name="guard_name" value={form.data.guard_name} onValueChange={(value) => form.setData('guard_name', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih guard" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="web">Web</SelectItem>
                                    <SelectItem value="api">API</SelectItem>
                                </SelectContent>
                            </Select>
                            {form.errors.guard_name && <InputError message={form.errors.guard_name} />}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={form.processing}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Menyimpan...' : permission ? 'Perbarui Permission' : 'Tambah Permission'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
