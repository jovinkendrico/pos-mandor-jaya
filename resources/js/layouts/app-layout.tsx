import { Toaster } from '@/components/ui/sonner';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { type ReactNode, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const { flash, errors } = usePage<SharedData>().props;
    const hasDisplayedMessages = useRef(false);

    useEffect(() => {
        hasDisplayedMessages.current = false;
    }, [flash]);

    useEffect(() => {
        if (!hasDisplayedMessages.current) {
            if (flash?.success) {
                toast.success(flash.success);
                hasDisplayedMessages.current = true;
            }
            if (flash?.error) {
                toast.error(flash.error);
                hasDisplayedMessages.current = true;
            }
            if (errors) {
                const errorMessages = Object.values(errors).flat();
                if (errorMessages.length > 0) {
                    toast.error(errorMessages[0]);
                    hasDisplayedMessages.current = true;
                }
            }
        }
    }, [flash]);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            <Toaster
                position="top-center"
                richColors
                closeButton
                theme="light"
                duration={1500}
            />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {children}
            </div>
        </AppLayoutTemplate>
    );
};
