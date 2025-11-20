import { index } from '@/routes/sales';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import useDebounce from './use-debounce';
import { FilterState } from './use-filterbar';

interface Filters {
    search: string;
    status: string;
    payment_status: string;
    date_from: string;
    date_to: string;
    sort_by: string;
    sort_order: string;
}

const usePurchaseFilters = (initialFilters: Filters) => {
    const [searchTerm, setSearchTerm] = useState(initialFilters.search);
    const [allFilters, setAllFilters] = useState(initialFilters);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const handleFilterChange = useCallback(
        (newFilters: FilterState) => {
            if (newFilters.search !== searchTerm) {
                setSearchTerm(newFilters.search);
                setAllFilters((prevFilters) => ({
                    ...prevFilters,
                    ...newFilters,
                }));
                return;
            }

            const updatedFilters = { ...allFilters, ...newFilters };
            setAllFilters(updatedFilters);

            router.get(index().url, updatedFilters, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [searchTerm, allFilters],
    );
    useEffect(() => {
        if (debouncedSearchTerm !== allFilters.search) {
            const updatedFilters = {
                ...allFilters,
                search: debouncedSearchTerm,
            };

            setAllFilters(updatedFilters);

            router.get(index().url, updatedFilters, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }
    }, [debouncedSearchTerm, allFilters]);

    return {
        allFilters,
        searchTerm,
        setSearchTerm,
        handleFilterChange,
    };
};

export default usePurchaseFilters;
