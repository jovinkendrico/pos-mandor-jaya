import PermissionGroupCard from '@/components/roles/permission-group-card';
import RoleDetailsCard from '@/components/roles/role-details-card';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { index } from '@/routes/roles';
import { Permission, PermissionGroup } from '@/types';
import { router } from '@inertiajs/react';

interface RoleFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: any; // Using any to accommodate both create and edit form types
    groupedPermissions: PermissionGroup;
    togglePermission: (permissionId: number) => void;
    toggleGroup: (groupPermissions: Permission[]) => void;
    onSubmit: (e: React.FormEvent) => void;
    processing: boolean;
    submitButtonText: string;
    title: string;
    description: string;
}

export default function RoleForm({
    form,
    groupedPermissions,
    togglePermission,
    toggleGroup,
    onSubmit,
    processing,
    submitButtonText,
}: RoleFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <RoleDetailsCard form={form} />

            <Card>
                <CardHeader>
                    <CardTitle>Tetapkan Permissions</CardTitle>
                    <CardDescription>
                        Pilih permissions yang akan ditetapkan untuk role ini
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(groupedPermissions).map(
                            ([group, groupPermissions]) => (
                                <PermissionGroupCard
                                    key={group}
                                    group={group}
                                    groupPermissions={groupPermissions}
                                    selectedPermissionIds={
                                        form.data.permissions_ids
                                    }
                                    togglePermission={togglePermission}
                                    toggleGroup={toggleGroup}
                                />
                            ),
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.get(index().url)}
                >
                    Batal
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? `${submitButtonText}...` : submitButtonText}
                </Button>
            </div>
        </form>
    );
}
