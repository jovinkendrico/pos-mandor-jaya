import { PageProps } from '../types';
import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { auth } = usePage<PageProps>().props;

    const hasPermission = (permission: string) => {
        return auth.permissions.includes(permission);
    };

    const hasRole = (role: string) => {
        return auth.roles.includes(role);
    };

    return { hasPermission, hasRole };
}
