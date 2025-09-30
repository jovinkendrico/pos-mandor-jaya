import EmptyData from '@/components/empty-data';
import PageTitle from '@/components/page-title';
import GroupedPermissionCard from '@/components/permissions/grouped-permission-card';
import PermissionDeleteConfirmation from '@/components/permissions/permission-delete-confirmation';
import PermissionForm from '@/components/permissions/permission-form';
import UngroupedPermissionsCard from '@/components/permissions/ungrouped-permissions-card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Permission, PermissionGroup } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    permissions: PermissionGroup;
    ungroupedPermissions: Permission[];
}

export default function PermissionsIndex({
    permissions,
    ungroupedPermissions,
}: PageProps) {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedPermission, setSelectedPermission] =
        useState<Permission | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleDelete = (permission: Permission) => {
        setSelectedPermission(permission);
        setIsDeleteModalOpen(true);
    };

    const handleEdit = (permission: Permission) => {
        setSelectedPermission(permission);
        setIsFormModalOpen(true);
    };

    const hasPermissions =
        Object.keys(permissions).length > 0 || ungroupedPermissions.length > 0;

    return (
        <AppLayout>
            <Head title="Permissions" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <PageTitle title="Permissions" />
                    <Button onClick={() => setIsFormModalOpen(true)}>
                        <Plus />
                        Tambah Permission
                    </Button>
                </div>

                {!hasPermissions ? (
                    <EmptyData
                        title="Belum ada Permissions"
                        description="Belum ada Permissions yang tersedia."
                    />
                ) : (
                    <div className="grid grid-cols-3 gap-4 space-y-4">
                        {Object.entries(permissions).map(
                            ([group, groupPermissions]) => (
                                <GroupedPermissionCard
                                    key={group}
                                    group={group}
                                    groupPermissions={groupPermissions}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                />
                            ),
                        )}

                        {ungroupedPermissions.length > 0 && (
                            <UngroupedPermissionsCard
                                ungroupedPermissions={ungroupedPermissions}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                            />
                        )}
                    </div>
                )}
            </div>
            <PermissionForm
                permission={selectedPermission}
                isModalOpen={isFormModalOpen}
                onOpenChange={setIsFormModalOpen}
            />
            <PermissionDeleteConfirmation
                permission={selectedPermission}
                isModalOpen={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
            />
        </AppLayout>
    );
}
