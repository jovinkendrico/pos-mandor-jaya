import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import UserDeleteConfirmation from '@/components/users/user-delete-confirmation';
import UserForm from '@/components/users/user-form';
import UserTable from '@/components/users/user-table';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/users';
import { BreadcrumbItem, Role, User } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    users: User[];
    roles: Role[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: index().url,
    },
];

export default function UserIndex({ users, roles }: PageProps) {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsFormModalOpen(true);
    };

    const handleDelete = (user: User) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleFormClose = () => {
        setIsFormModalOpen(false);
        setSelectedUser(null);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Users" />
                <div className="flex justify-between">
                    <PageTitle title="Users" />
                    <Button onClick={() => setIsFormModalOpen(true)}>
                        <Plus />
                        Tambah User
                    </Button>
                </div>
                <UserTable
                    users={users}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
                <UserForm
                    isModalOpen={isFormModalOpen}
                    onOpenChange={handleFormClose}
                    user={selectedUser}
                    roles={roles}
                />
                <UserDeleteConfirmation
                    isModalOpen={isDeleteModalOpen}
                    onOpenChange={setIsDeleteModalOpen}
                    user={selectedUser}
                />
            </AppLayout>
        </>
    );
}
