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
    page?: string | number;
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
    as_of_date?: string;
    min_stock?: string;
    max_stock?: string;
    limit?: string;
    min_days?: string;
    vehicle_id?: string;
}

const useResourceFilters = (
    resourceIndexRoute: RouteFunction,
    initialFilters: Filters,
    options: { isSPA?: boolean } = { isSPA: true },
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
                    page: 1, // Reset page when search term starts changing
                }));
                return;
            }

            const updatedFilters = { 
                ...allFilters, 
                ...newFilters,
                page: 1 // Reset page on filter change
            };
            setAllFilters(updatedFilters);

            if (options.isSPA) {
                router.get(resourceIndexRoute().url, updatedFilters, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            } else {
                const url = new URL(resourceIndexRoute().url, window.location.origin);
                Object.entries(updatedFilters).forEach(([key, value]) => {
                    if (value) url.searchParams.set(key, value.toString());
                });
                window.location.href = url.toString();
            }
        },
        [searchTerm, allFilters, resourceIndexRoute, options.isSPA],
    );

    // Search effect: Trigger redirect when debouncedSearchTerm changes and differs from URL
    useEffect(() => {
        if (debouncedSearchTerm !== initialFilters.search) {
            const updatedFilters = {
                ...allFilters,
                search: debouncedSearchTerm,
                page: 1, // Always reset to page 1 on search
            };

            setAllFilters(updatedFilters);

            if (options.isSPA) {
                router.get(resourceIndexRoute().url, updatedFilters, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            } else {
                const url = new URL(resourceIndexRoute().url, window.location.origin);
                Object.entries(updatedFilters).forEach(([key, value]) => {
                    if (value) url.searchParams.set(key, value.toString());
                });
                window.location.href = url.toString();
            }
        }
    }, [debouncedSearchTerm, initialFilters.search, resourceIndexRoute, options.isSPA]);
    // Note: removed allFilters from dependencies to prevent infinite loops and premature triggers

    return {
        allFilters,
        searchTerm,
        setSearchTerm,
        handleFilterChange,
    };
};

export default useResourceFilters;
