import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Permission } from '@/types';
import { Edit, Trash } from 'lucide-react';

interface UngroupedPermissionsCardProps {
    ungroupedPermissions: Permission[];
    onDelete: (permission: Permission) => void;
    onEdit: (permission: Permission) => void;
}

export default function UngroupedPermissionsCard({ onEdit, ungroupedPermissions, onDelete }: UngroupedPermissionsCardProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Permissions Tidak Dikelompokkan</CardTitle>
                    <CardDescription className="text-xs">
                        {ungroupedPermissions.length} izin{ungroupedPermissions.length !== 1 ? '' : ''}
                    </CardDescription>
                </div>
                <CardDescription className="pb-0">Izin yang tidak ditetapkan ke kelompok mana pun</CardDescription>
            </CardHeader>
            <CardContent className="py-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {ungroupedPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between rounded border p-2 text-sm hover:bg-muted">
                            <span className="truncate pr-2">{permission.name}</span>
                            <div className="flex space-x-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(permission)}>
                                    <Edit className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(permission)}>
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
