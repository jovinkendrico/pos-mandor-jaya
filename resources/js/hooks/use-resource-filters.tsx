import { router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import useDebounce from './use-debounce';
import { FilterState } from './use-filterbar';

interface ResourceRoute {
    url: string;
}

type RouteFunction = () => ResourceRoute;

interface Filters {
    search: string;
    status: string;
    payment_status?: string;
    date_from: string;
    date_to: string;
    sort_by: string;
    sort_order: string;
    bank_id?: string;
    reference_type?: string;
    payment_method?: string;
    customer_id?: string;
    supplier_id?: string;
    return_type?: string;
    type?: string;
    city_id?: string;
    is_active?: string;
    parent_id?: string;
    stock_filter?: string;
    item_id?: string;
    adjustment_type?: string;
    account_id?: string;
}

const useResourceFilters = (
    resourceIndexRoute: RouteFunction,
    initialFilters: Filters,
) => {
    const [searchTerm, setSearchTerm] = useState(initialFilters.search);
    const [allFilters, setAllFilters] = useState(initialFilters);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const handleFilterChange = useCallback(
        (newFilters: FilterState | Partial<Filters>) => {
            if (newFilters.search !== undefined && newFilters.search !== searchTerm) {
                setSearchTerm(newFilters.search);
                setAllFilters((prevFilters) => ({
                    ...prevFilters,
                    ...newFilters,
                }));
                return;
            }

            const updatedFilters = { ...allFilters, ...newFilters };
            setAllFilters(updatedFilters);

            router.get(resourceIndexRoute().url, updatedFilters, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [searchTerm, allFilters, resourceIndexRoute],
    );

    useEffect(() => {
        if (debouncedSearchTerm !== allFilters.search) {
            const updatedFilters = {
                ...allFilters,
                search: debouncedSearchTerm,
            };

            setAllFilters(updatedFilters);

            router.get(resourceIndexRoute().url, updatedFilters, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }
    }, [debouncedSearchTerm, allFilters, resourceIndexRoute]);

    return {
        allFilters,
        searchTerm,
        setSearchTerm,
        handleFilterChange,
    };
};

export default useResourceFilters;
