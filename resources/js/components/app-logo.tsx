import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name } = usePage<SharedData>().props;

    return (
        <div className="grid flex-1 text-left text-sm text-primary">
            <span className="mb-0.5 truncate text-lg leading-tight font-semibold">
                {name}
            </span>
        </div>
    );
}
