import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface FilterBarProps {
    filters: {
        search: string;
        status: string;
        payment_status: string;
        date_from: string;
        date_to: string;
        sort_by: string;
        sort_order: string;
    };
    onFilterChange: (filters: Record<string, string>) => void;
    statusOptions?: Array<{ value: string; label: string }>;
    sortOptions?: Array<{ value: string; label: string }>;
    showPaymentStatus?: boolean;
    showDateRange?: boolean;
}

export default function FilterBar({
    filters,
    onFilterChange,
    statusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
    ],
    sortOptions = [
        { value: 'purchase_date', label: 'Tanggal' },
        { value: 'purchase_number', label: 'Nomor' },
        { value: 'total_amount', label: 'Total' },
        { value: 'status', label: 'Status' },
    ],
    showPaymentStatus = true,
    showDateRange = true,
}: FilterBarProps) {
    const [localFilters, setLocalFilters] = useState(filters);

    // Sync local filters with props when they change
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleFilterChange = useCallback(
        (key: string, value: string) => {
            const newFilters = { ...localFilters, [key]: value };
            setLocalFilters(newFilters);
            onFilterChange(newFilters);
        },
        [localFilters, onFilterChange],
    );

    const handleReset = useCallback(() => {
        const resetFilters = {
            search: '',
            status: 'all',
            payment_status: 'all',
            date_from: '',
            date_to: '',
            sort_by: sortOptions[0]?.value || 'purchase_date',
            sort_order: 'desc',
        };
        setLocalFilters(resetFilters);
        onFilterChange(resetFilters);
    }, [onFilterChange, sortOptions]);

    const hasActiveFilters =
        localFilters.search ||
        localFilters.status !== 'all' ||
        localFilters.payment_status !== 'all' ||
        localFilters.date_from ||
        localFilters.date_to ||
        localFilters.sort_by !== (sortOptions[0]?.value || 'purchase_date') ||
        localFilters.sort_order !== 'desc';

    return (
        <div className="space-y-4 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-end gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search">Cari</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="search"
                            type="text"
                            placeholder="Cari nomor atau nama..."
                            value={localFilters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div className="w-[180px]">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={localFilters.status}
                        onValueChange={(value) => handleFilterChange('status', value)}
                    >
                        <SelectTrigger id="status">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Payment Status Filter */}
                {showPaymentStatus && (
                    <div className="w-[180px]">
                        <Label htmlFor="payment_status">Status Pembayaran</Label>
                        <Select
                            value={localFilters.payment_status}
                            onValueChange={(value) =>
                                handleFilterChange('payment_status', value)
                            }
                        >
                            <SelectTrigger id="payment_status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="paid">Lunas</SelectItem>
                                <SelectItem value="unpaid">Belum Lunas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Date Range */}
                {showDateRange && (
                    <>
                        <div className="w-[160px]">
                            <Label htmlFor="date_from">Dari Tanggal</Label>
                            <Input
                                id="date_from"
                                type="date"
                                value={localFilters.date_from}
                                onChange={(e) =>
                                    handleFilterChange('date_from', e.target.value)
                                }
                            />
                        </div>
                        <div className="w-[160px]">
                            <Label htmlFor="date_to">Sampai Tanggal</Label>
                            <Input
                                id="date_to"
                                type="date"
                                value={localFilters.date_to}
                                onChange={(e) =>
                                    handleFilterChange('date_to', e.target.value)
                                }
                            />
                        </div>
                    </>
                )}

                {/* Sort */}
                <div className="w-[180px]">
                    <Label htmlFor="sort_by">Urutkan</Label>
                    <div className="flex gap-2">
                        <Select
                            value={localFilters.sort_by}
                            onValueChange={(value) => handleFilterChange('sort_by', value)}
                        >
                            <SelectTrigger id="sort_by" className="flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                                handleFilterChange(
                                    'sort_order',
                                    localFilters.sort_order === 'asc' ? 'desc' : 'asc',
                                )
                            }
                            title={
                                localFilters.sort_order === 'asc'
                                    ? 'Urutkan Naik'
                                    : 'Urutkan Turun'
                            }
                        >
                            <ArrowUpDown className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                    <Button variant="outline" onClick={handleReset}>
                        <X className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                )}
            </div>
        </div>
    );
}

