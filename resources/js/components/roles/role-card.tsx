import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { edit } from '@/routes/roles';
import { Role } from '@/types';
import { router } from '@inertiajs/react';
import { Edit, Trash } from 'lucide-react';

interface RoleCardProps {
    role: Role;
    onDelete: (role: Role) => void;
}

export default function RoleCard({ role, onDelete }: RoleCardProps) {
    return (
        <Card key={role.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit(edit(role.id))}
                        >
                            <Edit />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(role)}
                        >
                            <Trash className="text-destructive" />
                        </Button>
                    </div>
                </div>
                <CardDescription>
                    {role.permissions.length} izin
                    {role.permissions.length !== 1 ? '' : ''}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {role.permissions.slice(0, 5).map((permission) => (
                        <span
                            key={permission.id}
                            className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
                        >
                            {permission.name}
                        </span>
                    ))}
                    {role.permissions.length > 5 && (
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                            +{role.permissions.length - 5} lainnya
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
