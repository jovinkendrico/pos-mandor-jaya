import RoleForm from '@/components/roles/role-form';
import AppLayout from '@/layouts/app-layout';
import { index, update } from '@/routes/roles';
import { Permission, PermissionGroup, Role, RoleFormData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

interface EditRolePageProps {
    role: Role;
    permissions: Permission[];
    groupedPermissions: PermissionGroup;
    selected_permission_ids: number[];
}

export default function EditRole({
    role,
    permissions,
    groupedPermissions,
    selected_permission_ids,
}: EditRolePageProps) {
    const form = useForm<RoleFormData>({
        name: role.name,
        guard_name: role.guard_name,
        permissions_ids: Array.isArray(selected_permission_ids)
            ? selected_permission_ids
            : [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = {
            ...form.data,
            permissions_ids: Array.isArray(form.data.permissions_ids)
                ? form.data.permissions_ids
                : [],
        };

        form.setData(formData);

        form.submit(update(role.id), {
            onSuccess: () => {
                router.get(index().url);
                toast.success('Role berhasil diperbarui');
            },
            onError: () => {
                toast.error('Gagal memperbarui role');
            },
        });
    };

    const togglePermission = (permissionId: number) => {
        const currentPermissions = form.data.permissions_ids;
        if (currentPermissions.includes(permissionId)) {
            form.setData(
                'permissions_ids',
                currentPermissions.filter((id) => id !== permissionId),
            );
        } else {
            form.setData('permissions_ids', [
                ...currentPermissions,
                permissionId,
            ]);
        }
    };

    const toggleGroup = (groupPermissions: Permission[]) => {
        const groupPermissionIds = groupPermissions.map((p) => p.id);
        const currentPermissions = form.data.permissions_ids;

        const allSelected = groupPermissionIds.every((id) =>
            currentPermissions.includes(id),
        );

        if (allSelected) {
            form.setData(
                'permissions_ids',
                currentPermissions.filter(
                    (id) => !groupPermissionIds.includes(id),
                ),
            );
        } else {
            const newPermissions = [...currentPermissions];
            groupPermissionIds.forEach((id) => {
                if (!newPermissions.includes(id)) {
                    newPermissions.push(id);
                }
            });
            form.setData('permissions_ids', newPermissions);
        }
    };

    return (
        <AppLayout>
            <Head title={`Edit Role: ${role.name}`} />

            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Edit Role
                    </h2>
                    <p className="text-muted-foreground">
                        Perbarui informasi role dan izin
                    </p>
                </div>

                <RoleForm
                    form={form}
                    groupedPermissions={groupedPermissions}
                    togglePermission={togglePermission}
                    toggleGroup={toggleGroup}
                    onSubmit={handleSubmit}
                    processing={form.processing}
                    submitButtonText="Perbarui Role"
                    title={`Edit Role: ${role.name}`}
                    description="Perbarui informasi role dan izin"
                />
            </div>
        </AppLayout>
    );
}
