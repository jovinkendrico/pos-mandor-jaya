import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { props } = usePage<{
        auth: {
            user: {
                roles: string[];
                permissions: string[];
            };
        };
    }>();

    const roles = props.auth?.user?.roles ?? [];
    const permissions = props.auth?.user?.permissions ?? [];

    const hasRole = (role: string) => roles.includes(role);
    const hasPermission = (permission: string) => permissions.includes(permission);

    return { hasRole, hasPermission };
}
