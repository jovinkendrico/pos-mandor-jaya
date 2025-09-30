import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Permission } from '@/types';
import { Edit, Trash } from 'lucide-react';

interface GroupedPermissionCardProps {
    group: string;
    groupPermissions: Permission[];
    onDelete: (permission: Permission) => void;
    onEdit: (permission: Permission) => void;
}

export default function GroupedPermissionCard({
    group,
    groupPermissions,
    onDelete,
    onEdit,
}: GroupedPermissionCardProps) {
    return (
        <Card key={group} className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-base capitalize">
                    {group || 'Tidak Dikelompokkan'}
                </CardTitle>
                <CardDescription className="text-xs">
                    {groupPermissions.length} izin
                    {groupPermissions.length !== 1 ? '' : ''}
                </CardDescription>
            </CardHeader>
            <CardContent className="">
                <div className="flex flex-col space-y-2">
                    {groupPermissions.map((permission) => (
                        <div
                            key={permission.id}
                            className="flex items-center justify-between rounded border-b p-2 text-sm hover:bg-muted"
                        >
                            <span className="truncate pr-2">
                                {permission.name}
                            </span>
                            <div className="flex space-x-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => onEdit(permission)}
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => onDelete(permission)}
                                >
                                    <Trash className="h-3 w-3 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
