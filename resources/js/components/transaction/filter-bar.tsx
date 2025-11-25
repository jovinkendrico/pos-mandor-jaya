import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    type FilterState,
    type Option,
    defaultSortOptions,
    defaultStatusOptions,
    useFilterBar,
} from '@/hooks/use-filterbar';
import { ArrowUpDown, Search, X } from 'lucide-react';
import { ReactNode } from 'react';
import { DatePicker } from '../date-picker';
import { Card } from '../ui/card';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '../ui/input-group';

interface FilterBarProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    statusOptions?: Option[];
    sortOptions?: Option[];
    showPaymentStatus?: boolean;
    showDateRange?: boolean;
    additionalFilters?: ReactNode;
}

const FilterBar = (props: FilterBarProps) => {
    const {
        filters,
        onFilterChange,
        statusOptions = defaultStatusOptions,
        sortOptions = defaultSortOptions,
        showPaymentStatus = true,
        showDateRange = true,
        additionalFilters,
    } = props;

    const {
        localFilters,
        handleFilterChange,
        handleReset,
        handleSortOrderToggle,
        hasActiveFilters,
    } = useFilterBar({ initialFilters: filters, onFilterChange, sortOptions });

    return (
        <Card className="content space-y-4 p-4">
            <div className="flex flex-wrap items-end gap-4">
                {/* Search */}
                <div className="min-w-[200px] flex-1">
                    <Label htmlFor="search">Cari</Label>
                    <InputGroup className="input-box">
                        <InputGroupInput
                            placeholder="Cari nomor atau nama..."
                            className=""
                            id="search"
                            type="text"
                            value={localFilters.search}
                            onChange={(e) =>
                                handleFilterChange('search', e.target.value)
                            }
                        />
                        <InputGroupAddon>
                            <Search />
                        </InputGroupAddon>
                    </InputGroup>
                </div>

                {/* Status Filter */}
                <div className="w-[180px]">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={localFilters.status}
                        onValueChange={(value) =>
                            handleFilterChange('status', value)
                        }
                    >
                        <SelectTrigger id="status" className="combobox">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((option: Option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Payment Status Filter */}
                {showPaymentStatus && (
                    <div className="w-[180px]">
                        <Label htmlFor="payment_status">
                            Status Pembayaran
                        </Label>
                        <Select
                            value={localFilters.payment_status}
                            onValueChange={(value) =>
                                handleFilterChange('payment_status', value)
                            }
                        >
                            <SelectTrigger
                                id="payment_status"
                                className="combobox"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="paid">Lunas</SelectItem>
                                <SelectItem value="unpaid">
                                    Belum Lunas
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Date Range */}
                {showDateRange && (
                    <>
                        <div className="w-[160px]">
                            <Label htmlFor="date_from">Dari Tanggal</Label>
                            <DatePicker
                                value={
                                    localFilters.date_from
                                        ? new Date(localFilters.date_from)
                                        : undefined
                                }
                                onChange={(value) => {
                                    handleFilterChange('date_from', value);
                                }}
                                className="input-box"
                            />
                        </div>
                        <div className="w-[160px]">
                            <Label htmlFor="date_to">Sampai Tanggal</Label>
                            <DatePicker
                                value={
                                    localFilters.date_to
                                        ? new Date(localFilters.date_to)
                                        : undefined
                                }
                                onChange={(value) => {
                                    handleFilterChange('date_to', value);
                                }}
                                className="input-box"
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
                            onValueChange={(value) =>
                                handleFilterChange('sort_by', value)
                            }
                        >
                            <SelectTrigger id="sort_by" className="combobox">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((option: Option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleSortOrderToggle}
                            title={
                                localFilters.sort_order === 'asc'
                                    ? 'Urutkan Naik'
                                    : 'Urutkan Turun'
                            }
                            className="btn-secondary"
                        >
                            <ArrowUpDown className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {additionalFilters && additionalFilters}

                {/* Reset Button */}
                {hasActiveFilters && (
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="btn-danger"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                )}
            </div>
        </Card>
    );
};

export default FilterBar;
