import { cn } from '@/lib/utils';
import { PaginatedData } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

interface TablePaginationProps {
    data: PaginatedData<unknown>;
}

const TablePagination = (props: TablePaginationProps) => {
    const { data } = props;
    return (
        <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
                <span className="font-extralight">
                    Menampilkan{' '}
                    <strong className="font-extrabold">{data.from}</strong>{' '}
                    hingga <strong className="font-extrabold">{data.to}</strong>{' '}
                    dari{' '}
                    <strong className="font-extrabold">{data.total}</strong>{' '}
                    data
                </span>
            </div>

            <nav>
                <ul className="flex flex-wrap gap-1">
                    {data.links.map((link) => {
                        const isPrev = link.label.includes('Previous');
                        const isNext = link.label.includes('Next');
                        const isNumber = !isPrev && !isNext;

                        let content: ReactNode;
                        if (isPrev) {
                            content = (
                                <>
                                    <ChevronLeft />
                                </>
                            );
                        } else if (isNext) {
                            content = (
                                <>
                                    <ChevronRight />
                                </>
                            );
                        } else {
                            content = <span>{link.label}</span>;
                        }

                        return (
                            <li key={link.label}>
                                <Link
                                    href={link.url ?? '#'}
                                    className={cn(
                                        'inline-flex h-9 cursor-pointer items-center justify-center rounded-full text-sm font-medium transition-colors',
                                        isNumber ? 'w-9' : 'gap-1 px-3',
                                        !link.url
                                            ? 'cursor-not-allowed text-gray-400'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-primary-400/30',
                                        link.active
                                            ? 'bg-gray-200 font-bold dark:bg-primary-500/60'
                                            : '',
                                    )}
                                    as="button"
                                    disabled={!link.url}
                                    preserveState
                                    preserveScroll
                                >
                                    {content}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
};

export default TablePagination;
