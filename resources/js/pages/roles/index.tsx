import { usePermission } from '@/hooks/use-permission';
import EmptyData from '@/components/empty-data';
import PageTitle from '@/components/page-title';
import RoleDeleteConfirmation from '@/components/roles/rolde-delete-confimation';
import RoleCard from '@/components/roles/role-card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { create } from '@/routes/roles';
import { Role } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface RolesPageProps {
    roles: Role[];
}

const RolesIndex = ({ roles }: RolesPageProps) => {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isDeletingModalOpen, setIsDeleteModalOpen] = useState(false);
    const { hasPermission } = usePermission();

    const handleCreate = () => {
        router.get(create().url);
    };

    const handleDelete = (role: Role) => {
        setSelectedRole(role);
        setIsDeleteModalOpen(true);
    };

    const hasRoles = roles.length > 0;

    return (
        <AppLayout>
            <Head title="Roles" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <PageTitle title="Roles" />
                    {hasPermission('roles.create') && (
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Buat Role
                        </Button>
                    )}
                </div>

                {!hasRoles ? (
                    <EmptyData
                        title="Tidak ada role ditemukan"
                        description="Belum ada role dalam sistem. Buat role baru untuk memulai."
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {roles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
            <RoleDeleteConfirmation
                role={selectedRole}
                isModalOpen={isDeletingModalOpen}
                onOpenChange={setIsDeleteModalOpen}
            />
        </AppLayout>
    );
};

export default RolesIndex;
