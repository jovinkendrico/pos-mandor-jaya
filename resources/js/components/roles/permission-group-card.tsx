import { Checkbox } from '@/components/ui/checkbox';
import { Permission } from '@/types';

interface PermissionGroupCardProps {
    group: string;
    groupPermissions: Permission[];
    selectedPermissionIds: number[];
    togglePermission: (permissionId: number) => void;
    toggleGroup: (groupPermissions: Permission[]) => void;
}

export default function PermissionGroupCard({
    group,
    groupPermissions,
    selectedPermissionIds,
    togglePermission,
    toggleGroup,
}: PermissionGroupCardProps) {
    const groupPermissionIds = groupPermissions.map((p) => p.id);
    const allSelected = groupPermissionIds.every((id) => selectedPermissionIds.includes(id));
    const someSelected = groupPermissionIds.some((id) => selectedPermissionIds.includes(id));

    return (
        <div key={group} className="space-y-3 rounded-lg border shadow-sm">
            <div className="mb-0 flex items-center space-x-2 border-b p-4">
                <Checkbox
                    id={`group-${group}`}
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={() => toggleGroup(groupPermissions)}
                />
                <label
                    htmlFor={`group-${group}`}
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    <span className="capitalize">{group || 'Tidak Dikelompokkan'}</span>
                    <span className="ml-2 text-muted-foreground">({groupPermissions.length} permission)</span>
                </label>
            </div>

            <div className="ml-3 grid grid-cols-2 gap-2 space-y-2 p-4">
                {groupPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`permission-${permission.id}`}
                            checked={selectedPermissionIds.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                        />
                        <label
                            htmlFor={`permission-${permission.id}`}
                            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {permission.name}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
