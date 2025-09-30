import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { router } from "@inertiajs/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface AsyncComboboxOption {
  value: string
  label: string
  [key: string]: any
}

interface AsyncComboboxProps {
  initialOptions?: AsyncComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyText?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  searchUrl: string
  searchParam?: string
  debounceMs?: number
}

export function AsyncCombobox({
  initialOptions = [],
  value = "",
  onValueChange,
  placeholder = "Select option...",
  emptyText = "No option found.",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  searchUrl,
  searchParam = "search",
  debounceMs = 300,
}: AsyncComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [options, setOptions] = React.useState<AsyncComboboxOption[]>(initialOptions)
  const [loading, setLoading] = React.useState(false)

  const debouncedSearch = React.useCallback(
    React.useMemo(() => {
      let timeoutId: NodeJS.Timeout
      return (searchTerm: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          if (!searchTerm.trim()) {
            setOptions(initialOptions)
            return
          }

          setLoading(true)
          try {
            const url = `${searchUrl}?${searchParam}=${encodeURIComponent(searchTerm)}`
            
            const response = await fetch(url, {
              headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
              },
            })
            
            
            if (response.ok) {
              const data = await response.json()
              setOptions(data.data || [])
            } else {
              setOptions([])
            }
          } catch (error) {
            setOptions([])
          } finally {
            setLoading(false)
          }
        }, debounceMs)
      }
    }, [searchUrl, searchParam, debounceMs, initialOptions]),
    [searchUrl, searchParam, debounceMs, initialOptions]
  )

  React.useEffect(() => {
    debouncedSearch(searchValue)
  }, [searchValue, debouncedSearch])

  const selectedOption = [...initialOptions, ...options].find((option) => option.value === value)

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === value ? "" : selectedValue
    onValueChange?.(newValue)
    setOpen(false)
  }

  const handleSearchChange = (newSearchValue: string) => {
    setSearchValue(newSearchValue)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={handleSearchChange}
            className="h-9"
          />
          <CommandList>
            {loading && (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}
            {!loading && options.length === 0 && searchValue && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}