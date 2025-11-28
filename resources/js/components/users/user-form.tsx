import { store, update } from '@/actions/App/Http/Controllers/UserController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Role, User } from '@/types';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import InputError from '../input-error';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface UserFormProps {
    user?: User | null;
    roles: Role[];
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function UserForm({
    user,
    isModalOpen,
    onOpenChange,
    roles,
}: UserFormProps) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [] as number[], // Store role IDs
    });

    useEffect(() => {
        if (user) {
            // Extract role IDs for the user
            const userRoleIds =
                user.roles && Array.isArray(user.roles)
                    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      user.roles.map((role: any) => role.id)
                    : [];

            form.setData({
                name: user.name,
                email: user.email,
                password: '',
                password_confirmation: '',
                roles: userRoleIds,
            });
        } else {
            form.reset();
        }
    }, [user, isModalOpen, form]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.submit(user ? update(user.id) : store(), {
            onSuccess: () => {
                form.reset();
                toast.success(
                    user
                        ? 'User berhasil diupdate'
                        : 'User berhasil ditambahkan',
                );
                onOpenChange(false);
            },
            onError: () => {
                toast.error('Terjadi kesalahan, periksa input Anda.');
            },
        });
    };

    const toggleRole = (roleId: number) => {
        const currentRoles = form.data.roles || [];
        if (currentRoles.includes(roleId)) {
            // Remove role if already selected
            form.setData(
                'roles',
                currentRoles.filter((id) => id !== roleId),
            );
        } else {
            // Add role if not selected
            form.setData('roles', [...currentRoles, roleId]);
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {user ? 'Edit User' : 'Tambah User'}
                    </DialogTitle>
                    <DialogDescription>
                        {user
                            ? 'Perbarui informasi user di bawah.'
                            : 'Isi data detail untuk menambahkan user baru'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col space-y-2"
                >
                    <div className="flex flex-col space-y-4 pb-4">
                        <div>
                            <Label htmlFor="name" required>
                                Nama
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                            />
                            {form.errors.name && (
                                <InputError message={form.errors.name} />
                            )}
                        </div>

                        <div>
                            <Label htmlFor="email" required>
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={form.data.email}
                                onChange={(e) =>
                                    form.setData('email', e.target.value)
                                }
                            />
                            {form.errors.email && (
                                <InputError message={form.errors.email} />
                            )}
                        </div>

                        <div className="flex flex-row gap-4">
                            <div className="w-1/2">
                                <Label htmlFor="password" required={!user}>
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={form.data.password}
                                    onChange={(e) =>
                                        form.setData('password', e.target.value)
                                    }
                                />
                                {form.errors.password && (
                                    <InputError
                                        message={form.errors.password}
                                    />
                                )}
                                {user && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Kosongkan jika tidak diubah
                                    </p>
                                )}
                            </div>

                            <div className="w-1/2">
                                <Label
                                    htmlFor="password_confirmation"
                                    required={!user}
                                >
                                    Konfirmasi Password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    value={form.data.password_confirmation}
                                    onChange={(e) =>
                                        form.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                                {form.errors.password_confirmation && (
                                    <InputError
                                        message={
                                            form.errors.password_confirmation
                                        }
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <Label>Roles</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {roles.map((role) => (
                                    <Badge
                                        key={role.id}
                                        variant={
                                            form.data.roles?.includes(role.id)
                                                ? 'default'
                                                : 'outline'
                                        }
                                        className="cursor-pointer"
                                        onClick={() => toggleRole(role.id)}
                                    >
                                        {role.name}
                                    </Badge>
                                ))}
                            </div>
                            {form.errors.roles && (
                                <InputError message={form.errors.roles} />
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? 'Saving...'
                                : user
                                  ? 'Update User'
                                  : 'Tambah User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
