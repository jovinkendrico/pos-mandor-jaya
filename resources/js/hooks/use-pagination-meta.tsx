import { PaginatedData } from '@/types';

export function usePaginationMeta<T>(paginated: PaginatedData<T>) {
    const currentPage = parseInt(paginated.current_page?.toString() ?? '1');
    const perPage = parseInt(paginated.per_page?.toString() ?? '10');
    const from = paginated.from ?? 0;
    const to = paginated.to ?? 0;
    const total = paginated.total ?? 0;

    return { currentPage, perPage, from, to, total };
}
