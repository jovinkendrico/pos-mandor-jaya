import RoleForm from '@/components/roles/role-form';
import AppLayout from '@/layouts/app-layout';
import { index, store } from '@/routes/roles';
import { Permission, PermissionGroup, RoleFormData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

interface CreateRolePageProps {
    permissions: Permission[];
    groupedPermissions: PermissionGroup;
}

const CreateRole = (props: CreateRolePageProps) => {
    const { permissions, groupedPermissions } = props;

    const form = useForm<RoleFormData>({
        name: '',
        guard_name: 'web',
        permissions_ids: [],
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

        form.submit(store(), {
            onSuccess: () => {
                router.get(index().url);
                toast.success('Role berhasil ditambahkan');
            },
            onError: () => {
                toast.error('Gagal membuat role');
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
            <Head title="Buat Role" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Buat Role
                    </h2>
                    <p className="text-muted-foreground">
                        Tambah role baru dan tetapkan izin
                    </p>
                </div>

                <RoleForm
                    form={form}
                    groupedPermissions={groupedPermissions}
                    togglePermission={togglePermission}
                    toggleGroup={toggleGroup}
                    onSubmit={handleSubmit}
                    processing={form.processing}
                    submitButtonText="Buat Role"
                    title="Buat Role"
                    description="Tambah role baru dan tetapkan izin"
                />
            </div>
        </AppLayout>
    );
};

export default CreateRole;
