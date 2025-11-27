import { formatDatetoString } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';

export interface FilterState {
    search: string;
    status: string;
    payment_status?: string;
    date_from: string;
    date_to: string;
    return_type?: string;
    supplier_id?: string;
    sort_by: string;
    sort_order: string;
    bank_id?: string;
    payment_method?: string;
    customer_id?: string;
    parent_id?: string;
    type?: string;
    stock_filter?: string;
    city_id?: string;
    is_active?: string;
    item_id?: string;
    adjustment_type?: string;
    reference_type?: string;
    [key: string]: any;
}

export interface Option {
    value: string;
    label: string;
}

interface UseFilterBarProps {
    initialFilters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    sortOptions?: Option[];
    defaultSortOrder?: string;
}

interface UseFilterBarReturn {
    localFilters: FilterState;
    handleFilterChange: (
        key: keyof FilterState,
        value: string | Date | undefined,
    ) => void;
    handleReset: () => void;
    handleSortOrderToggle: () => void;
    hasActiveFilters: boolean;
}

export const defaultStatusOptions: Option[] = [
    { value: 'all', label: 'Semua Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
];

export const defaultSortOptions: Option[] = [
    { value: 'purchase_date', label: 'Tanggal' },
    { value: 'purchase_number', label: 'Nomor' },
    { value: 'total_amount', label: 'Total' },
    { value: 'status', label: 'Status' },
];

export const useFilterBar = ({
    initialFilters,
    onFilterChange,
    sortOptions = defaultSortOptions,
    defaultSortOrder = 'desc',
}: UseFilterBarProps): UseFilterBarReturn => {
    const [localFilters, setLocalFilters] =
        useState<FilterState>(initialFilters);

    useEffect(() => {
        setLocalFilters(initialFilters);
    }, [initialFilters]);

    const handleFilterChange = useCallback(
        (key: keyof FilterState, value: string | Date | undefined) => {
            let processedValue: string;

            if (value instanceof Date) {
                processedValue = formatDatetoString(value);
            } else if (value === undefined) {
                processedValue = '';
            } else {
                processedValue = value;
            }

            const newFilters: FilterState = {
                ...localFilters,
                [key]: processedValue,
            };
            setLocalFilters(newFilters);
            onFilterChange(newFilters);
        },
        [localFilters, onFilterChange],
    );

    const handleSortOrderToggle = useCallback(() => {
        const newOrder = localFilters.sort_order === 'asc' ? 'desc' : 'asc';
        handleFilterChange('sort_order', newOrder);
    }, [localFilters.sort_order, handleFilterChange]);

    const handleReset = useCallback(() => {
        const resetFilters: FilterState = {
            search: '',
            status: 'all',
            payment_status: 'all',
            return_type: 'all',
            supplier_id: '',
            date_from: '',
            date_to: '',
            sort_by: sortOptions[0]?.value || 'purchase_date',
            sort_order: defaultSortOrder,
            bank_id: '',
            payment_method: 'all',
            customer_id: '',
            parent_id: '',
            type: 'all',
            stock_filter: 'all',
            city_id: '',
            is_active: 'all',
            item_id: '',
            adjustment_type: 'all',
            reference_type: 'all',
        };
        setLocalFilters(resetFilters);
        onFilterChange(resetFilters);
    }, [onFilterChange, sortOptions, defaultSortOrder]);

    const defaultSortBy = sortOptions[0]?.value;

    const hasActiveFilters =
        (localFilters.search ?? '') !== '' ||
        (localFilters.status ?? 'all') !== 'all' ||
        (localFilters.payment_status ?? 'all') !== 'all' ||
        (localFilters.return_type ?? 'all') !== 'all' ||
        (localFilters.supplier_id ?? '') !== '' ||
        (localFilters.date_from ?? '') !== '' ||
        (localFilters.date_to ?? '') !== '' ||
        localFilters.sort_by !== defaultSortBy ||
        localFilters.sort_order !== defaultSortOrder ||
        (localFilters.bank_id ?? '') !== '' ||
        (localFilters.payment_method ?? 'all') !== 'all' ||
        (localFilters.customer_id ?? '') !== '' ||
        (localFilters.parent_id ?? '') !== '' ||
        (localFilters.type ?? 'all') !== 'all' ||
        (localFilters.stock_filter ?? 'all') !== 'all' ||
        (localFilters.city_id ?? '') !== '' ||
        (localFilters.is_active ?? 'all') !== 'all' ||
        (localFilters.item_id ?? '') !== '' ||
        (localFilters.adjustment_type ?? 'all') !== 'all' ||
        (localFilters.reference_type ?? 'all') !== 'all';

    return {
        localFilters,
        handleFilterChange,
        handleReset,
        handleSortOrderToggle,
        hasActiveFilters,
    };
};
