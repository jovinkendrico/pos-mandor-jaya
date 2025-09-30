// hooks/useSearchSync.ts
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import useDebounce from './use-debounce';

export function useSearchSync(baseUrl: string, currentParams: Record<string, string>) {
    const [search, setSearch] = useState(currentParams.search ?? '');
    const debouncedSearch = useDebounce(search, 250);

    useEffect(() => {
        const params: Record<string, string> = {
            ...currentParams,
            search: debouncedSearch,
        };

        if (debouncedSearch !== (currentParams.search ?? '')) {
            delete params.page;
        }

        router.get(baseUrl, params, { preserveState: true, replace: true });
    }, [debouncedSearch, currentParams.search, baseUrl]);

    return { search, setSearch };
}
