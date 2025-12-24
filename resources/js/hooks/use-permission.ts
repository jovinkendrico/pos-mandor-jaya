import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { props } = usePage<SharedData>();

    const roles = props.auth?.roles ?? [];
    const permissions = props.auth?.permissions ?? [];

    const hasRole = (role: string) => roles.includes(role);
    const hasPermission = (permission: string) => permissions.includes(permission);

    return { hasRole, hasPermission };
}
