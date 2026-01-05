import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
    value: string;
    label: string;
    searchTerms?: string[]; // Additional terms to search on
    [key: string]: unknown; // Allow additional properties
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onValueChange?: (value: string, option?: ComboboxOption) => void;
    placeholder?: string;
    emptyText?: string;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
    maxDisplayItems?: number;
    onAdd?: () => void;
    addLabel?: string;
    searchUrl?: string; // Optional: URL for backend search
    searchParam?: string; // Optional: Query parameter name for search
    debounceMs?: number; // Optional: Debounce delay for search
}

export function Combobox({
    options,
    value = '',
    onValueChange,
    placeholder = 'Select option...',
    emptyText = 'No option found.',
    searchPlaceholder = 'Search...',
    className,
    disabled = false,
    maxDisplayItems = 5,
    onAdd,
    addLabel = 'Add',
    searchUrl,
    searchParam = 'search',
    debounceMs = 300,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<ComboboxOption[]>(
        [],
    );
    const [loading, setLoading] = React.useState(false);

    const [cachedSelectedOption, setCachedSelectedOption] = React.useState<
        ComboboxOption | undefined
    >(undefined);

    // Backend search effect
    React.useEffect(() => {
        if (!searchUrl || !searchValue.trim()) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        const timeoutId = setTimeout(async () => {
            try {
                const url = `${searchUrl}?${searchParam}=${encodeURIComponent(searchValue)}`;
                const response = await fetch(url, {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    const fetchedOptions = data.data || [];
                    // Map backend response to ComboboxOption format
                    setSearchResults(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        fetchedOptions.map((opt: any) => ({
                            value: opt.value || String(opt.id),
                            label:
                                opt.label ||
                                `${opt.purchase_number || opt.sale_number || opt.code || ''} - ${opt.supplier?.name || opt.customer?.name || opt.name || ''}`,
                            ...opt,
                        })),
                    );
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                console.error('Error fetching search results:', error);
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        }, debounceMs);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [searchValue, searchUrl, searchParam, debounceMs]);

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
        // If backend search is enabled and there's a search value, use search results
        if (searchUrl && searchValue.trim()) {
            return searchResults;
        }

        // Otherwise, use client-side filtering
        if (!searchValue) {
            return options.slice(0, maxDisplayItems);
        }
        const searchLower = searchValue.toLowerCase();
        return options.filter((option) => {
            // Search in label
            if (option.label.toLowerCase().includes(searchLower)) {
                return true;
            }
            // Search in additional search terms
            if (option.searchTerms) {
                return option.searchTerms.some((term) =>
                    term.toLowerCase().includes(searchLower),
                );
            }
            return false;
        });
    }, [options, searchValue, maxDisplayItems, searchUrl, searchResults]);

    // Get selected option from cache, options, or search results
    const selectedOption = React.useMemo(() => {
        // 1. Check cached option (if value matches)
        if (cachedSelectedOption && cachedSelectedOption.value === value) {
            return cachedSelectedOption;
        }

        // 2. Check in options
        const foundInOptions = options.find((option) => option.value === value);
        if (foundInOptions) return foundInOptions;

        // 3. Check in search results
        if (searchUrl && searchResults.length > 0) {
            const foundInSearch = searchResults.find(
                (opt) => opt.value === value,
            );
            if (foundInSearch) return foundInSearch;
        }

        return undefined;
    }, [value, options, searchResults, searchUrl, cachedSelectedOption]);

    const handleSelect = (selectedValue: string) => {
        // Find the full option object
        let option = options.find((opt) => opt.value === selectedValue);
        if (!option) {
            option = searchResults.find((opt) => opt.value === selectedValue);
        }

        // Update cache if we found the option
        if (option) {
            setCachedSelectedOption(option);
        }

        const newValue = selectedValue === value ? '' : selectedValue;
        
        // Find the selected option object
        let option: ComboboxOption | undefined;
        if (searchUrl && searchResults.length > 0) {
            option = searchResults.find((opt) => opt.value === selectedValue);
        } 
        if (!option) {
             option = options.find((opt) => opt.value === selectedValue);
        }

        onValueChange?.(newValue, option);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('justify-between', className)}
                    disabled={disabled}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onValueChange={setSearchValue}
                        className="h-9"
                    />
                    {onAdd && (
                        <>
                            <CommandGroup>
                                <CommandItem
                                    onSelect={() => {
                                        setOpen(false);
                                        onAdd();
                                    }}
                                    className="btn-secondary cursor-pointer"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {addLabel}
                                </CommandItem>
                            </CommandGroup>
                            <CommandSeparator />
                        </>
                    )}
                    <CommandList>
                        {loading && (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                                Searching...
                            </div>
                        )}
                        {!loading && filteredOptions.length === 0 && (
                            <CommandEmpty>{emptyText}</CommandEmpty>
                        )}
                        {!loading && filteredOptions.length > 0 && (
                            <CommandGroup>
                                {filteredOptions.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        keywords={[option.label]}
                                        onSelect={() =>
                                            handleSelect(option.value)
                                        }
                                        className="data-[disabled=true]:pointer-events-auto data-[disabled=true]:opacity-100"
                                    >
                                        {option.label}
                                        <Check
                                            className={cn(
                                                'ml-auto h-4 w-4',
                                                value === option.value
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
